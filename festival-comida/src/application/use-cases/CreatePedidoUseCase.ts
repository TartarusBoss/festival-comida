import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";
import type { IProductosRepository } from "../../domain/repositories/IProductosRepository.js";

export class CreatePedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository,
    private readonly productosRepository: IProductosRepository,
  ) {}

  async execute(input: unknown) {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("INVALID_DATA");
    }

    const { asistente_id, producto_id, cantidad } = input as Record<string, unknown>;

    if (
      !Number.isInteger(asistente_id) ||
      !Number.isInteger(producto_id) ||
      !Number.isInteger(cantidad)
    ) {
      throw new Error("INVALID_DATA");
    }

    if ((cantidad as number) < 1 || (cantidad as number) > 10) {
      throw new Error("INVALID_CANTIDAD");
    }

    const asistenteExiste =
      await this.pedidosRepository.existsAsistente(asistente_id as number);

    if (!asistenteExiste) {
      throw new Error("ASISTENTE_NOT_FOUND");
    }

    const producto = await this.productosRepository.findById(producto_id as number);

    if (!producto) {
      throw new Error("PRODUCTO_NOT_FOUND");
    }

    if ((cantidad as number) > producto.stock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const total = producto.precio * (cantidad as number);

    const pedido = await this.pedidosRepository.createWithStock({
        asistente_id: asistente_id as number,
        producto_id: producto_id as number,
        cantidad: cantidad as number,
        total,
        estado: "PENDIENTE",
    });

    if (!pedido) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    return pedido;
  }
}