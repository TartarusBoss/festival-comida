export interface Pedido {
  id: number;
  asistente_id: number;
  producto_id: number;
  cantidad: number;
  total: number;
  estado: "PENDIENTE" | "ENTREGADO";
  state: "ACTIVE" | "REMOVED";
}