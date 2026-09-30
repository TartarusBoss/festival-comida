import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";

export class GetPedidosUseCase {
  constructor(private readonly pedidosRepository: IPedidosRepository) {}

  async execute(filters?: {
    asistente_id?: number;
    producto_id?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const repositoryFilters: {
      asistente_id?: number;
      producto_id?: number;
      estado?: string;
      page: number;
      limit: number;
    } = {
      page,
      limit,
    };

    if (filters?.asistente_id !== undefined) {
      repositoryFilters.asistente_id = filters.asistente_id;
    }

    if (filters?.producto_id !== undefined) {
      repositoryFilters.producto_id = filters.producto_id;
    }

    if (filters?.estado !== undefined) {
      repositoryFilters.estado = filters.estado;
    }

    const result = await this.pedidosRepository.findAll(repositoryFilters);

    const totalPages = Math.ceil(result.total / limit);

    return {
      pagination: {
        total: result.total,
        currentPage: page,
        limit,
        totalPages,
      },
      data: result.data,
    };
  }
}