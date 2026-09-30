import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";
import type { IProductosRepository } from "../../domain/repositories/IProductosRepository.js";

export class CreatePedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository,
    private readonly productosRepository: IProductosRepository,
  ) {}

  async execute(input: {
    asistente_id: number;
    producto_id: number;
    cantidad: number;
  }) {
    if (
      !Number.isInteger(input.asistente_id) ||
      !Number.isInteger(input.producto_id) ||
      !Number.isInteger(input.cantidad)
    ) {
      throw new Error("INVALID_DATA");
    }

    if (input.cantidad < 1 || input.cantidad > 10) {
      throw new Error("INVALID_CANTIDAD");
    }

    const asistenteExiste =
      await this.pedidosRepository.existsAsistente(input.asistente_id);

    if (!asistenteExiste) {
      throw new Error("ASISTENTE_NOT_FOUND");
    }

    const producto = await this.productosRepository.findById(input.producto_id);

    if (!producto) {
      throw new Error("PRODUCTO_NOT_FOUND");
    }

    if (input.cantidad > producto.stock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const total = producto.precio * input.cantidad;

    const pedido = await this.pedidosRepository.create({
        asistente_id: input.asistente_id,
        producto_id: input.producto_id,
        cantidad: input.cantidad,
        total,
        estado: "PENDIENTE",
    });

    await this.productosRepository.updateStock(
        producto.id,
        producto.stock - input.cantidad,
    );

    return pedido;
  }
}