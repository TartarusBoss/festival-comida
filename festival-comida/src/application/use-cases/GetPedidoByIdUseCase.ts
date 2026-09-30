import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";

export class GetPedidoByIdUseCase {
  constructor(private readonly pedidosRepository: IPedidosRepository) {}

  async execute(id: number) {
    const pedido = await this.pedidosRepository.findById(id);

    if (!pedido) {
      throw new Error("PEDIDO_NOT_FOUND");
    }

    return pedido;
  }
}