import { prisma } from "../db/prisma.js";
import type { Pedido } from "../../domain/entities/Pedido.js";
import type { IPedidosRepository } from "../../domain/repositories/IPedidosRepository.js";

export class PrismaPedidosRepository implements IPedidosRepository {
  async findAll(filters?: {
    asistente_id?: number;
    producto_id?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Pedido[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      state: "ACTIVE",
      ...(filters?.asistente_id !== undefined
        ? { asistente_id: filters.asistente_id }
        : {}),
      ...(filters?.producto_id !== undefined
        ? { producto_id: filters.producto_id }
        : {}),
      ...(filters?.estado !== undefined
        ? { estado: filters.estado }
        : {}),
    };

    const [pedidos, total] = await Promise.all([
      prisma.pedidos_comida.findMany({
        where,
        orderBy: {
          id: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.pedidos_comida.count({
        where,
      }),
    ]);

    return {
      data: pedidos.map((pedido) => ({
        id: pedido.id,
        asistente_id: pedido.asistente_id,
        producto_id: pedido.producto_id,
        cantidad: pedido.cantidad,
        total: pedido.total,
        estado: pedido.estado as "PENDIENTE" | "ENTREGADO",
        state: pedido.state as "ACTIVE" | "REMOVED",
      })),
      total,
    };
  }
  async existsAsistente(id: number): Promise<boolean> {
  const asistente = await prisma.asistentes.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  return asistente !== null;
}

  async findById(id: number): Promise<Pedido | null> {
    const pedido = await prisma.pedidos_comida.findFirst({
      where: {
        id,
        state: "ACTIVE",
      },
    });

    if (!pedido) {
      return null;
    }

    return {
      id: pedido.id,
      asistente_id: pedido.asistente_id,
      producto_id: pedido.producto_id,
      cantidad: pedido.cantidad,
      total: pedido.total,
      estado: pedido.estado as "PENDIENTE" | "ENTREGADO",
      state: pedido.state as "ACTIVE" | "REMOVED",
    };
  }

  async create(pedido: {
    asistente_id: number;
    producto_id: number;
    cantidad: number;
    total: number;
    estado: string;
  }): Promise<Pedido> {
    const nuevoPedido = await prisma.pedidos_comida.create({
      data: {
        asistente_id: pedido.asistente_id,
        producto_id: pedido.producto_id,
        cantidad: pedido.cantidad,
        total: pedido.total,
        estado: pedido.estado,
      },
    });

    return {
      id: nuevoPedido.id,
      asistente_id: nuevoPedido.asistente_id,
      producto_id: nuevoPedido.producto_id,
      cantidad: nuevoPedido.cantidad,
      total: nuevoPedido.total,
      estado: nuevoPedido.estado as "PENDIENTE" | "ENTREGADO",
      state: nuevoPedido.state as "ACTIVE" | "REMOVED",
    };
  }

  async updateEstado(id: number, estado: string): Promise<Pedido> {
    const pedido = await prisma.pedidos_comida.update({
      where: {
        id,
      },
      data: {
        estado,
      },
    });

    return {
      id: pedido.id,
      asistente_id: pedido.asistente_id,
      producto_id: pedido.producto_id,
      cantidad: pedido.cantidad,
      total: pedido.total,
      estado: pedido.estado as "PENDIENTE" | "ENTREGADO",
      state: pedido.state as "ACTIVE" | "REMOVED",
    };
  }

  async delete(id: number): Promise<Pedido> {
    const pedido = await prisma.pedidos_comida.update({
      where: {
        id,
      },
      data: {
        state: "REMOVED",
      },
    });

    return {
      id: pedido.id,
      asistente_id: pedido.asistente_id,
      producto_id: pedido.producto_id,
      cantidad: pedido.cantidad,
      total: pedido.total,
      estado: pedido.estado as "PENDIENTE" | "ENTREGADO",
      state: pedido.state as "ACTIVE" | "REMOVED",
    };
  }
}