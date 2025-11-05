import { Router } from "express";
import { create, getById, list } from "../controllers/conversation.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { createConversationSchema } from "../validators/conversation.validator";

const router = Router();

router.use(authenticate);

router.post("/", validateRequest(createConversationSchema), asyncHandler(create));
router.get("/", asyncHandler(list));
router.get("/:id", asyncHandler(getById));

export default router;
