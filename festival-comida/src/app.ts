import "dotenv/config";
import express from "express";
import cors from "cors";

import { PedidosController } from "./infraestructure/http/controllers/PedidosController.js";
import { createPedidosRoutes } from "./infraestructure/http/routes/pedidosRoutes.js";

import { PrismaPedidosRepository } from "./infraestructure/repositories/PrismaPedidosRepository.js";
import { PrismaProductosRepository } from "./infraestructure/repositories/PrismaProductosRepository.js";

import { GetPedidosUseCase } from "./application/use-cases/GetPedidosUseCase.js";
import { GetPedidoByIdUseCase } from "./application/use-cases/GetPedidoByIdUseCase.js";
import { CreatePedidoUseCase } from "./application/use-cases/CreatePedidoUseCase.js";
import { UpdatePedidoEstadoUseCase } from "./application/use-cases/UpdatePedidoEstadoUseCase.js";
import { DeletePedidoUseCase } from "./application/use-cases/DeletePedidoUseCase.js";

const pedidosRepository = new PrismaPedidosRepository();
const productosRepository = new PrismaProductosRepository();

const getPedidosUseCase = new GetPedidosUseCase(
  pedidosRepository,
);

const getPedidoByIdUseCase = new GetPedidoByIdUseCase(
  pedidosRepository,
);

const createPedidoUseCase = new CreatePedidoUseCase(
  pedidosRepository,
  productosRepository,
);

const updatePedidoEstadoUseCase = new UpdatePedidoEstadoUseCase(
  pedidosRepository,
);

const deletePedidoUseCase = new DeletePedidoUseCase(
  pedidosRepository,
  productosRepository,
);


const app = express(); //crea la app de express

app.use(cors());
app.use(express.json()); //permite que Express lea cuerpos JSON

const pedidosController = new PedidosController(
  getPedidosUseCase,
  getPedidoByIdUseCase,
  createPedidoUseCase,
  updatePedidoEstadoUseCase,
  deletePedidoUseCase,
);

const pedidosRoutes = createPedidosRoutes(pedidosController);

app.use("/api/pedidos-comida", pedidosRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});