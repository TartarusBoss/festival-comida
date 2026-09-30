import type { Producto } from "../entities/Producto.js"; //va el type porque solo necesito comprobar los tipos, no necesito importar codigo ni nada

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