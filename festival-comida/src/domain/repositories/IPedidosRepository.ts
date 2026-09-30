import type { Pedido } from "../entities/Pedido.js";

export interface IPedidosRepository {
  findAll(filters?: {
    asistente_id?: number;
    producto_id?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Pedido[];
    total: number;
  }>;

  findById(id: number): Promise<Pedido | null>;
  
  existsAsistente(id: number): Promise<boolean>;

  create(pedido: {
    asistente_id: number;
    producto_id: number;
    cantidad: number;
    total: number;
    estado: string;
  }): Promise<Pedido>;

  updateEstado(id: number, estado: string): Promise<Pedido>;

  delete(id: number): Promise<Pedido>;
}