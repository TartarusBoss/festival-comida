import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";
import type { IProductosRepository } from "../../domain/repositories/IProductosRepository.js";

export class DeletePedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository,
    private readonly productosRepository: IProductosRepository,
  ) {}

  async execute(id: number) {
    const pedido = await this.pedidosRepository.findById(id);

    if (!pedido) {
      throw new Error("PEDIDO_NOT_FOUND");
    }

    if (pedido.estado === "ENTREGADO") {
      throw new Error("PEDIDO_ALREADY_DELIVERED");
    }

    const producto = await this.productosRepository.findById(pedido.producto_id);

    if (!producto) {
        throw new Error("PRODUCTO_NOT_FOUND");
    }

    const nuevoStock = producto.stock + pedido.cantidad;

    await this.productosRepository.updateStock(producto.id, nuevoStock);

    return await this.pedidosRepository.delete(id);

  }
}