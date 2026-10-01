import assert from "node:assert/strict";
import test from "node:test";

import { CreatePedidoUseCase } from "../src/application/use-cases/CreatePedidoUseCase.ts";
import { DeletePedidoUseCase } from "../src/application/use-cases/DeletePedidoUseCase.ts";
import { UpdatePedidoEstadoUseCase } from "../src/application/use-cases/UpdatePedidoEstadoUseCase.ts";
import type { Pedido } from "../src/domain/entities/Pedido.ts";
import type { Producto } from "../src/domain/entities/Producto.ts";
import type {
  CancelPedidoResult,
  IPedidosRepository,
} from "../src/domain/repositories/IPedidosRepository.ts";
import type { IProductosRepository } from "../src/domain/repositories/IProductosRepository.ts";

const productoBase: Producto = {
  id: 2,
  nombre: "Bandeja paisa mini",
  zona_id: 5,
  precio: 28000,
  stock: 50,
  state: "ACTIVE",
};

const pedidoBase: Pedido = {
  id: 10,
  asistente_id: 5,
  producto_id: 2,
  cantidad: 2,
  total: 56000,
  estado: "PENDIENTE",
  state: "ACTIVE",
};

interface FakeOptions {
  asistenteExiste?: boolean;
  producto?: Producto | null;
  pedido?: Pedido | null;
  resultadoCreacion?: Pedido | null;
  resultadoCancelacion?: CancelPedidoResult;
}

function crearRepositorios(options: FakeOptions = {}) {
  let entradaCreacion: Parameters<IPedidosRepository["createWithStock"]>[0] | undefined;
  let cancelaciones = 0;
  let consultasProducto = 0;

  const pedidosRepository: IPedidosRepository = {
    findAll: async () => ({ data: [], total: 0 }),
    findById: async () => options.pedido === undefined ? pedidoBase : options.pedido,
    existsAsistente: async () => options.asistenteExiste ?? true,
    createWithStock: async (pedido) => {
      entradaCreacion = pedido;
      if (options.resultadoCreacion !== undefined) {
        return options.resultadoCreacion;
      }
      return {
        ...pedidoBase,
        ...pedido,
        id: 11,
        estado: "PENDIENTE",
        state: "ACTIVE",
      };
    },
    updateEstado: async (id, estado) => ({
      ...pedidoBase,
      id,
      estado: estado as Pedido["estado"],
    }),
    cancelAndRestoreStock: async (id) => {
      cancelaciones++;
      return options.resultadoCancelacion ?? {
        status: "CANCELLED",
        pedido: { ...pedidoBase, id, state: "REMOVED" },
      };
    },
  };

  const productosRepository: IProductosRepository = {
    findAll: async () => ({ data: [], total: 0 }),
    findById: async () => {
      consultasProducto++;
      return options.producto === undefined ? productoBase : options.producto;
    },
  };

  return {
    pedidosRepository,
    productosRepository,
    get entradaCreacion() { return entradaCreacion; },
    get cancelaciones() { return cancelaciones; },
    get consultasProducto() { return consultasProducto; },
  };
}

async function rechazaConCodigo(action: () => Promise<unknown>, code: string) {
  await assert.rejects(action, (error: unknown) =>
    error instanceof Error && error.message === code,
  );
}

test("crear pedido calcula el total y lo inicia pendiente", async () => {
  const repos = crearRepositorios();
  const useCase = new CreatePedidoUseCase(
    repos.pedidosRepository,
    repos.productosRepository,
  );

  const pedido = await useCase.execute({
    asistente_id: 5,
    producto_id: 2,
    cantidad: 2,
  });

  assert.equal(pedido.total, 56000);
  assert.equal(pedido.estado, "PENDIENTE");
  assert.equal(repos.entradaCreacion?.total, 56000);
});

test("crear pedido rechaza cuerpo incompleto y cantidad fuera de rango", async (t) => {
  const useCase = new CreatePedidoUseCase(
    crearRepositorios().pedidosRepository,
    crearRepositorios().productosRepository,
  );

  await t.test("cuerpo incompleto", () =>
    rechazaConCodigo(() => useCase.execute({}), "INVALID_DATA"),
  );
  await t.test("cantidad cero", () =>
    rechazaConCodigo(
      () => useCase.execute({ asistente_id: 5, producto_id: 2, cantidad: 0 }),
      "INVALID_CANTIDAD",
    ),
  );
  await t.test("cantidad mayor a diez", () =>
    rechazaConCodigo(
      () => useCase.execute({ asistente_id: 5, producto_id: 2, cantidad: 11 }),
      "INVALID_CANTIDAD",
    ),
  );
});

test("crear pedido valida las referencias antes de reservar stock", async (t) => {
  await t.test("asistente inexistente", async () => {
    const repos = crearRepositorios({ asistenteExiste: false });
    const useCase = new CreatePedidoUseCase(
      repos.pedidosRepository,
      repos.productosRepository,
    );

    await rechazaConCodigo(
      () => useCase.execute({ asistente_id: 99, producto_id: 2, cantidad: 1 }),
      "ASISTENTE_NOT_FOUND",
    );
    assert.equal(repos.consultasProducto, 0);
  });

  await t.test("producto inexistente", () => {
    const repos = crearRepositorios({ producto: null });
    const useCase = new CreatePedidoUseCase(
      repos.pedidosRepository,
      repos.productosRepository,
    );

    return rechazaConCodigo(
      () => useCase.execute({ asistente_id: 5, producto_id: 99, cantidad: 1 }),
      "PRODUCTO_NOT_FOUND",
    );
  });
});

test("crear pedido rechaza stock insuficiente incluso ante una reserva concurrente", async (t) => {
  await t.test("stock leído insuficiente", () => {
    const repos = crearRepositorios({ producto: { ...productoBase, stock: 1 } });
    const useCase = new CreatePedidoUseCase(
      repos.pedidosRepository,
      repos.productosRepository,
    );

    return rechazaConCodigo(
      () => useCase.execute({ asistente_id: 5, producto_id: 2, cantidad: 2 }),
      "INSUFFICIENT_STOCK",
    );
  });

  await t.test("stock cambia antes de completar la reserva", () => {
    const repos = crearRepositorios({ resultadoCreacion: null });
    const useCase = new CreatePedidoUseCase(
      repos.pedidosRepository,
      repos.productosRepository,
    );

    return rechazaConCodigo(
      () => useCase.execute({ asistente_id: 5, producto_id: 2, cantidad: 2 }),
      "INSUFFICIENT_STOCK",
    );
  });
});

test("cancelar pedido pendiente restaura stock y marca el pedido removido", async () => {
  const repos = crearRepositorios();
  const useCase = new DeletePedidoUseCase(repos.pedidosRepository);

  const pedido = await useCase.execute(pedidoBase.id);

  assert.equal(pedido.state, "REMOVED");
  assert.equal(repos.cancelaciones, 1);
});

test("cancelar no permite pedido entregado ni inexistente", async (t) => {
  await t.test("pedido ya entregado", async () => {
    const repos = crearRepositorios({
      pedido: { ...pedidoBase, estado: "ENTREGADO" },
    });
    const useCase = new DeletePedidoUseCase(repos.pedidosRepository);

    await rechazaConCodigo(
      () => useCase.execute(pedidoBase.id),
      "PEDIDO_ALREADY_DELIVERED",
    );
    assert.equal(repos.cancelaciones, 0);
  });

  await t.test("pedido inexistente", () => {
    const repos = crearRepositorios({ pedido: null });
    const useCase = new DeletePedidoUseCase(repos.pedidosRepository);

    return rechazaConCodigo(
      () => useCase.execute(pedidoBase.id),
      "PEDIDO_NOT_FOUND",
    );
  });
});

test("actualizar pedido solo acepta estados permitidos y el campo estado", async (t) => {
  const repos = crearRepositorios();
  const useCase = new UpdatePedidoEstadoUseCase(repos.pedidosRepository);

  await t.test("estado permitido", async () => {
    const pedido = await useCase.execute(pedidoBase.id, { estado: "ENTREGADO" });
    assert.equal(pedido.estado, "ENTREGADO");
  });

  await t.test("estado inválido", () =>
    rechazaConCodigo(
      () => useCase.execute(pedidoBase.id, { estado: "COCINANDO" }),
      "INVALID_ESTADO",
    ),
  );

  await t.test("campo adicional", () =>
    rechazaConCodigo(
      () => useCase.execute(pedidoBase.id, { estado: "PENDIENTE", total: 1 }),
      "INVALID_PATCH",
    ),
  );
});