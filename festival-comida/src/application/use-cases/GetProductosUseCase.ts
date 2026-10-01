import type { IProductosRepository } from "../../domain/repositories/IProductosRepository.js";

export class GetProductosUseCase {
	constructor(private readonly productosRepository: IProductosRepository) {}

	async execute(filters?: {
		zona_id?: number;
		page?: number;
		limit?: number;
	}) {
		const page = filters?.page ?? 1;
		const limit = filters?.limit ?? 10;
		const repositoryFilters: {
			zona_id?: number;
			page: number;
			limit: number;
		} = { page, limit };

		if (filters?.zona_id !== undefined) {
			repositoryFilters.zona_id = filters.zona_id;
		}

		const result = await this.productosRepository.findAll(repositoryFilters);

		return {
			pagination: {
				total: result.total,
				currentPage: page,
				limit,
				totalPages: Math.ceil(result.total / limit),
			},
			data: result.data,
		};
	}
}
