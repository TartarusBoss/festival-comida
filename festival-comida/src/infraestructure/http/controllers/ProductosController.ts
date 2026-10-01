import type { Request, Response } from "express";
import type { GetProductosUseCase } from "../../../application/use-cases/GetProductosUseCase.js";
import type { GetProductoByIdUseCase } from "../../../application/use-cases/GetProductoByIdUseCase.js";

export class ProductosController {
	constructor(
		private readonly getProductosUseCase: GetProductosUseCase,
		private readonly getProductoByIdUseCase: GetProductoByIdUseCase,
	) {}

	async getAll(req: Request, res: Response) {
		const page = req.query.page === undefined ? 1 : Number(req.query.page);
		const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
		const zona_id = req.query.zona_id === undefined
			? undefined
			: Number(req.query.zona_id);

		try {
			const result = await this.getProductosUseCase.execute({
				page,
				limit,
				...(zona_id === undefined ? {} : { zona_id }),
			});
			return res.status(200).json(result);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith("INVALID_")) {
				return res.status(400).json({ error: "Parámetros de consulta no válidos" });
			}

			console.error(error);
			return res.status(500).json({ error: "Error interno del servidor" });
		}
	}

	async getById(req: Request, res: Response) {
		const id = Number(req.params.id);

		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: "El id debe ser un entero positivo" });
		}

		try {
			const producto = await this.getProductoByIdUseCase.execute(id);
			return res.status(200).json({ data: producto });
		} catch (error) {
			if (error instanceof Error && error.message === "PRODUCTO_NOT_FOUND") {
				return res.status(404).json({ error: "Producto no encontrado" });
			}

			console.error(error);
			return res.status(500).json({ error: "Error interno del servidor" });
		}
	}
}
