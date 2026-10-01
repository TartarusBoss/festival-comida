import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";

import type { GetPedidosUseCase } from "../src/application/use-cases/GetPedidosUseCase.js";
import type { GetPedidoByIdUseCase } from "../src/application/use-cases/GetPedidoByIdUseCase.js";
import type { CreatePedidoUseCase } from "../src/application/use-cases/CreatePedidoUseCase.js";
import type { UpdatePedidoEstadoUseCase } from "../src/application/use-cases/UpdatePedidoEstadoUseCase.js";
import type { DeletePedidoUseCase } from "../src/application/use-cases/DeletePedidoUseCase.js";
import type { GetProductosUseCase } from "../src/application/use-cases/GetProductosUseCase.js";
import type { GetProductoByIdUseCase } from "../src/application/use-cases/GetProductoByIdUseCase.js";
import { PedidosController } from "../src/infraestructure/http/controllers/PedidosController.js";
import { ProductosController } from "../src/infraestructure/http/controllers/ProductosController.js";
import { createPedidosRoutes } from "../src/infraestructure/http/routes/pedidosRoutes.js";
import { createProductosRoutes } from "../src/infraestructure/http/routes/productosRoutes.js";
import { errorHandler, notFoundHandler } from "../src/infraestructure/http/middleware/errorHandlers.js";

type Handler = (...args: unknown[]) => Promise<unknown>;

interface Handlers {
  getPedidos?: Handler;
  getPedidoById?: Handler;
  createPedido?: Handler;
  updatePedido?: Handler;
  deletePedido?: Handler;
  getProductos?: Handler;
  getProductoById?: Handler;
}

async function withApi(handlers: Handlers, run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());

  const pedidosController = new PedidosController(
    { execute: handlers.getPedidos ?? (async () => ({ pagination: {}, data: [] })) } as unknown as GetPedidosUseCase,
    { execute: handlers.getPedidoById ?? (async () => { throw new Error("PEDIDO_NOT_FOUND"); }) } as unknown as GetPedidoByIdUseCase,
    { execute: handlers.createPedido ?? (async () => ({})) } as unknown as CreatePedidoUseCase,
    { execute: handlers.updatePedido ?? (async () => ({})) } as unknown as UpdatePedidoEstadoUseCase,
    { execute: handlers.deletePedido ?? (async () => ({})) } as unknown as DeletePedidoUseCase,
  );
  const productosController = new ProductosController(
    { execute: handlers.getProductos ?? (async () => ({ pagination: {}, data: [] })) } as unknown as GetProductosUseCase,
    { execute: handlers.getProductoById ?? (async () => { throw new Error("PRODUCTO_NOT_FOUND"); }) } as unknown as GetProductoByIdUseCase,
  );

  app.use("/api/pedidos-comida", createPedidosRoutes(pedidosController));
  app.use("/api/productos-comida", createProductosRoutes(productosController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

async function assertError(response: Response, status: number): Promise<{ error: string }> {
  assert.equal(response.status, status);
  const body = await response.json() as { error?: unknown };
  assert.equal(typeof body.error, "string");
  assert.ok(body.error.length > 0);
  return body as { error: string };
}

test("listados inválidos responden 400 con error JSON", async () => {
  await withApi({
    getPedidos: async () => { throw new Error("INVALID_PAGINATION"); },
    getProductos: async () => { throw new Error("INVALID_ZONA_ID"); },
  }, async (baseUrl) => {
    await assertError(await fetch(`${baseUrl}/api/pedidos-comida?page=0`), 400);
    await assertError(await fetch(`${baseUrl}/api/productos-comida?zona_id=abc`), 400);
  });
});

test("IDs con formato inválido responden 400 con error JSON", async () => {
  await withApi({}, async (baseUrl) => {
    await assertError(await fetch(`${baseUrl}/api/pedidos-comida/abc`), 400);
    await assertError(await fetch(`${baseUrl}/api/productos-comida/abc`), 400);
  });
});

test("PATCH con campos no permitidos responde 400 con error JSON", async () => {
  await withApi({
    updatePedido: async () => { throw new Error("INVALID_PATCH"); },
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/pedidos-comida/10`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "PENDIENTE", total: 1 }),
    });

    await assertError(response, 400);
  });
});

test("recursos inexistentes responden 404 con error JSON", async () => {
  await withApi({}, async (baseUrl) => {
    await assertError(await fetch(`${baseUrl}/api/pedidos-comida/999`), 404);
    await assertError(await fetch(`${baseUrl}/api/productos-comida/999`), 404);
  });
});

test("cancelar un pedido entregado responde 409 con error JSON", async () => {
  await withApi({
    deletePedido: async () => { throw new Error("PEDIDO_ALREADY_DELIVERED"); },
  }, async (baseUrl) => {
    await assertError(await fetch(`${baseUrl}/api/pedidos-comida/10`, {
      method: "DELETE",
    }), 409);
  });
});

test("rutas desconocidas responden 404 con error JSON", async () => {
  await withApi({}, async (baseUrl) => {
    await assertError(await fetch(`${baseUrl}/api/no-existe`), 404);
  });
});

test("JSON mal formado responde 400 con error JSON sin stack trace", async () => {
  await withApi({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/pedidos-comida`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const body = await assertError(response, 400);
    assert.equal(body.error.includes("SyntaxError"), false);
  });
});