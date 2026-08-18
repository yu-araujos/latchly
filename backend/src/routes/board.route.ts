import { Router } from "express";
import { getBoardById } from "../controllers/board.controller";
import { createColumn } from "../controllers/column.controller";

const boardRoutes = Router();

boardRoutes.get("/:id", getBoardById);
boardRoutes.post("/:boardId/columns", createColumn);

export { boardRoutes };
