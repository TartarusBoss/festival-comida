import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";

export class UpdatePedidoEstadoUseCase {
  constructor(private readonly pedidosRepository: IPedidosRepository) {}

  async execute(id: number, estado: string) {
    if (estado !== "PENDIENTE" && estado !== "ENTREGADO") {
      throw new Error("INVALID_ESTADO");
    }

    const pedido = await this.pedidosRepository.findById(id);

    if (!pedido) {
      throw new Error("PEDIDO_NOT_FOUND");
    }

    return await this.pedidosRepository.updateEstado(id, estado);
  }
}