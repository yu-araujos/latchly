import { Router } from "express";
import { getBoardById } from "../controllers/board.controller";

const boardRoutes = Router()

boardRoutes.get('/:id', getBoardById);

export {boardRoutes}