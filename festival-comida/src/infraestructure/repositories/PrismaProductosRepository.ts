import { prisma } from "../db/prisma.js";
import type { Producto } from "../../domain/entities/Producto.js";
import type { IProductosRepository } from "../../domain/repositories/IProductosRepository.js";

export class PrismaProductosRepository implements IProductosRepository {
  async findAll(filters?: {
    zona_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Producto[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      state: "ACTIVE",
      ...(filters?.zona_id !== undefined
        ? { zona_id: filters.zona_id }
        : {}),
    };

    const [productos, total] = await Promise.all([
      prisma.productos_comida.findMany({
        where,
        orderBy: {
          id: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.productos_comida.count({
        where,
      }),
    ]);

    return {
      data: productos.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        zona_id: producto.zona_id,
        precio: producto.precio,
        stock: producto.stock,
        state: producto.state as "ACTIVE" | "REMOVED",
      })),
      total,
    };
  }

  async findById(id: number): Promise<Producto | null> {
    const producto = await prisma.productos_comida.findFirst({
      where: {
        id,
        state: "ACTIVE",
      },
    });

    if (!producto) {
      return null;
    }

    return {
      id: producto.id,
      nombre: producto.nombre,
      zona_id: producto.zona_id,
      precio: producto.precio,
      stock: producto.stock,
      state: producto.state as "ACTIVE" | "REMOVED",
    };
  }

  async updateStock(id: number, stock: number): Promise<Producto> {
    const producto = await prisma.productos_comida.update({
      where: {
        id,
      },
      data: {
        stock,
      },
    });

    return {
      id: producto.id,
      nombre: producto.nombre,
      zona_id: producto.zona_id,
      precio: producto.precio,
      stock: producto.stock,
      state: producto.state as "ACTIVE" | "REMOVED",
    };
  }
}