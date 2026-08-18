import { Router } from "express";
import {
  createColumn,
  updateColumn,
  deleteColumn,
} from "../controllers/column.controller";

const columnRoutes = Router();

columnRoutes.patch("/:id", updateColumn);
columnRoutes.delete("/:id", deleteColumn);

export { columnRoutes };
