import type { IProductosRepository } from "../../domain/repositories/IProductosRepository.js";

export class GetProductoByIdUseCase {
	constructor(private readonly productosRepository: IProductosRepository) {}

	async execute(id: number) {
		const producto = await this.productosRepository.findById(id);

		if (!producto) {
			throw new Error("PRODUCTO_NOT_FOUND");
		}

		return producto;
	}
}
