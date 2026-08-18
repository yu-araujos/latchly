import { Router } from "express";
import {
  createCard,
  updateCard,
  moveCard,
  deleteCard,
} from "../controllers/card.controller";

const cardRoutes = Router();

cardRoutes.post("/", createCard);
cardRoutes.patch("/:id", updateCard);
cardRoutes.patch("/:id/move", moveCard);
cardRoutes.delete("/:id", deleteCard);

export { cardRoutes };
