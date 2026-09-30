export interface Producto {
  id: number;
  nombre: string;
  zona_id: number;
  precio: number;
  stock: number;
  state: "ACTIVE" | "REMOVED";
}