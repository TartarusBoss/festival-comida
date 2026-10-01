import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  return res.status(404).json({ error: "Ruta no encontrada" });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "El cuerpo JSON no es válido" });
  }

  return res.status(500).json({ error: "Error interno del servidor" });
};