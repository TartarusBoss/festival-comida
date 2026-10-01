import type { Request, Response } from "express";
import type { GetPedidosUseCase } from "../../../application/use-cases/GetPedidosUseCase.js";
import type { GetPedidoByIdUseCase } from "../../../application/use-cases/GetPedidoByIdUseCase.js";
import type { CreatePedidoUseCase } from "../../../application/use-cases/CreatePedidoUseCase.js";
import type { UpdatePedidoEstadoUseCase } from "../../../application/use-cases/UpdatePedidoEstadoUseCase.js";
import type { DeletePedidoUseCase } from "../../../application/use-cases/DeletePedidoUseCase.js";

export class PedidosController {
  constructor(
    private readonly getPedidosUseCase: GetPedidosUseCase,
    private readonly getPedidoByIdUseCase: GetPedidoByIdUseCase,
    private readonly createPedidoUseCase: CreatePedidoUseCase,
    private readonly updatePedidoEstadoUseCase: UpdatePedidoEstadoUseCase,
    private readonly deletePedidoUseCase: DeletePedidoUseCase,
  ) {}

  async getAll(req: Request, res: Response) {
    try {
      const page =
        req.query.page !== undefined
          ? Number(req.query.page)
          : 1;

      const limit =
        req.query.limit !== undefined
          ? Number(req.query.limit)
          : 10;

      const asistente_id =
        req.query.asistente_id !== undefined
          ? Number(req.query.asistente_id)
          : undefined;

      const producto_id =
        req.query.producto_id !== undefined
          ? Number(req.query.producto_id)
          : undefined;

      const estado =
        req.query.estado !== undefined
          ? String(req.query.estado)
          : undefined;

      if (
        !Number.isInteger(page) ||
        page <= 0 ||
        !Number.isInteger(limit) ||
        limit <= 0 ||
        limit > 50
      ) {
        return res.status(400).json({
          error:
            "Los parámetros page y limit deben ser enteros positivos y limit no puede ser mayor a 50",
        });
      }

      if (
        asistente_id !== undefined &&
        (!Number.isInteger(asistente_id) || asistente_id <= 0)
      ) {
        return res.status(400).json({
          error: "asistente_id debe ser un entero positivo",
        });
      }

      if (
        producto_id !== undefined &&
        (!Number.isInteger(producto_id) || producto_id <= 0)
      ) {
        return res.status(400).json({
          error: "producto_id debe ser un entero positivo",
        });
      }

      if (
        estado !== undefined &&
        estado !== "PENDIENTE" &&
        estado !== "ENTREGADO"
      ) {
        return res.status(400).json({
          error: "estado debe ser PENDIENTE o ENTREGADO",
        });
      }

      const filters: {
        page: number;
        limit: number;
        asistente_id?: number;
        producto_id?: number;
        estado?: string;
      } = {
        page,
        limit,
      };

      if (asistente_id !== undefined) {
        filters.asistente_id = asistente_id;
      }

      if (producto_id !== undefined) {
        filters.producto_id = producto_id;
      }

      if (estado !== undefined) {
        filters.estado = estado;
      }

      const result = await this.getPedidosUseCase.execute(filters);

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "El id debe ser un entero positivo",
        });
      }

      const pedido = await this.getPedidoByIdUseCase.execute(id);

      return res.status(200).json({
        data: pedido,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "PEDIDO_NOT_FOUND") {
        return res.status(404).json({
          error: "Pedido no encontrado",
        });
      }

      console.error(error);

      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const body = req.body;

      if (
        body === null ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        return res.status(400).json({
          error: "El cuerpo de la solicitud debe ser un objeto",
        });
      }

      const { asistente_id, producto_id, cantidad } = body;

      if (
        !Number.isInteger(asistente_id) ||
        !Number.isInteger(producto_id) ||
        !Number.isInteger(cantidad)
      ) {
        return res.status(400).json({
          error:
            "asistente_id, producto_id y cantidad deben ser enteros",
        });
      }

      if (cantidad < 1 || cantidad > 10) {
        return res.status(400).json({
          error: "La cantidad debe estar entre 1 y 10",
        });
      }

      const pedido = await this.createPedidoUseCase.execute({
        asistente_id,
        producto_id,
        cantidad,
      });

      return res.status(201).json({
        data: pedido,
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "ASISTENTE_NOT_FOUND":
            return res.status(404).json({
              error: "El asistente no existe",
            });

          case "PRODUCTO_NOT_FOUND":
            return res.status(404).json({
              error: "El producto no existe",
            });

          case "INSUFFICIENT_STOCK":
            return res.status(409).json({
              error: "No hay suficiente stock para realizar el pedido",
            });

          case "INVALID_DATA":
          case "INVALID_CANTIDAD":
            return res.status(400).json({
              error: "Los datos del pedido no son válidos",
            });
        }
      }

      console.error(error);

      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "El id debe ser un entero positivo",
        });
      }

      // Primero verificamos que el pedido exista.
      await this.getPedidoByIdUseCase.execute(id);

      const body = req.body;

      if (
        body === null ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        return res.status(400).json({
          error: "El cuerpo de la solicitud debe ser un objeto",
        });
      }

      const fields = Object.keys(body);

      if (
        fields.length !== 1 ||
        fields[0] !== "estado"
      ) {
        return res.status(400).json({
          error: "Solo se puede modificar el campo estado",
        });
      }

      if (
        body.estado !== "PENDIENTE" &&
        body.estado !== "ENTREGADO"
      ) {
        return res.status(400).json({
          error: "estado debe ser PENDIENTE o ENTREGADO",
        });
      }

      const pedido = await this.updatePedidoEstadoUseCase.execute(
        id,
        body.estado,
      );

      return res.status(200).json({
        data: pedido,
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "PEDIDO_NOT_FOUND":
            return res.status(404).json({
              error: "Pedido no encontrado",
            });

          case "INVALID_ESTADO":
            return res.status(400).json({
              error: "estado debe ser PENDIENTE o ENTREGADO",
            });
        }
      }

      console.error(error);

      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "El id debe ser un entero positivo",
        });
      }

      const pedido = await this.deletePedidoUseCase.execute(id);

      return res.status(200).json({
        data: pedido,
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "PEDIDO_NOT_FOUND":
            return res.status(404).json({
              error: "Pedido no encontrado",
            });

          case "PEDIDO_ALREADY_DELIVERED":
            return res.status(409).json({
              error:
                "No se puede cancelar un pedido que ya fue entregado",
            });

          case "PRODUCTO_NOT_FOUND":
            return res.status(404).json({
              error: "El producto asociado no existe",
            });
        }
      }

      console.error(error);

      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }
}
