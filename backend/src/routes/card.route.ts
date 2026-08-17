import { Router } from "express";
import { createCard, updateCard, moveCard } from "../controllers/card.controller";

const cardRotutes = Router();

cardRotutes.post('/', createCard)
cardRotutes.patch('/:id', updateCard)
cardRotutes.patch('/:id/move', moveCard)

export {cardRotutes};