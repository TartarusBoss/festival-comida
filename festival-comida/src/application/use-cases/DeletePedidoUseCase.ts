import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";

export class DeletePedidoUseCase {
  constructor(private readonly pedidosRepository: IPedidosRepository) {}

  async execute(id: number) {
    const pedido = await this.pedidosRepository.findById(id);

    if (!pedido) {
      throw new Error("PEDIDO_NOT_FOUND");
    }

    if (pedido.estado === "ENTREGADO") {
      throw new Error("PEDIDO_ALREADY_DELIVERED");
    }

    const result = await this.pedidosRepository.cancelAndRestoreStock(id);

    if (result.status === "NOT_FOUND") {
      throw new Error("PEDIDO_NOT_FOUND");
    }

    if (result.status === "DELIVERED") {
      throw new Error("PEDIDO_ALREADY_DELIVERED");
    }

    return result.pedido;
  }
}