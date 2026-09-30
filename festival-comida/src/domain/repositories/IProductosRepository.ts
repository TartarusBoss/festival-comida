import { Producto } from "../entities/Producto.js";

export interface IProductosRepository {
  findAll(filters?: {
    zona_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Producto[];
    total: number;
  }>;

  findById(id: number): Promise<Producto | null>;

  updateStock(id: number, stock: number): Promise<Producto>;
}