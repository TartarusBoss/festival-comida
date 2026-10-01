import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";

export class UpdatePedidoEstadoUseCase {
  constructor(private readonly pedidosRepository: IPedidosRepository) {}

  async execute(id: number, input: unknown) {
    const pedido = await this.pedidosRepository.findById(id);

    if (!pedido) {
      throw new Error("PEDIDO_NOT_FOUND");
    }

    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).length !== 1 ||
      !Object.hasOwn(input, "estado")
    ) {
      throw new Error("INVALID_PATCH");
    }

    const estado = (input as Record<string, unknown>).estado;
    if (estado !== "PENDIENTE" && estado !== "ENTREGADO") {
      throw new Error("INVALID_ESTADO");
    }

    return await this.pedidosRepository.updateEstado(id, estado);
  }
}