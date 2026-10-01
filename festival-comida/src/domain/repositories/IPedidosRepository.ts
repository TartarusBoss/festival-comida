import type { Pedido } from "../entities/Pedido.js";

export type CancelPedidoResult =
  | { status: "CANCELLED"; pedido: Pedido }
  | { status: "NOT_FOUND" }
  | { status: "DELIVERED" };

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

  createWithStock(pedido: {
    asistente_id: number;
    producto_id: number;
    cantidad: number;
    total: number;
    estado: string;
  }): Promise<Pedido | null>;

  updateEstado(id: number, estado: string): Promise<Pedido>;

  cancelAndRestoreStock(id: number): Promise<CancelPedidoResult>;
}