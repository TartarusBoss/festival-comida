import { Router } from "express";
import { PedidosController } from "../controllers/PedidosController.js";

export function createPedidosRoutes(
  controller: PedidosController,
) {
  const router = Router();

  router.get("/", controller.getAll.bind(controller)); // recibe: GET /api/pedidos-comida
  router.get("/:id", controller.getById.bind(controller)); // recibe: GET /api/pedidos-comida/5
  router.post("/", controller.create.bind(controller)); // recibe: POST /api/pedidos-comida
  router.patch("/:id", controller.update.bind(controller)); // recibe: PATCH /api/pedidos-comida/5
  router.delete("/:id", controller.delete.bind(controller)); // recibe: DELETE /api/pedidos-comida/5

  return router;
}