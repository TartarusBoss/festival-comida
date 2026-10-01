import { Router } from "express";
import { ProductosController } from "../controllers/ProductosController.js";

export function createProductosRoutes(controller: ProductosController) {
  const router = Router();

  router.get("/", controller.getAll.bind(controller));
  router.get("/:id", controller.getById.bind(controller));

  return router;
}