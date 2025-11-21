import { Router } from "express";
import { edit, getById, remove, send } from "../controllers/message.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { sendMessageSchema, updateMessageSchema } from "../validators/message.validator";

const router = Router();

router.use(authenticate);
router.post("/", validateRequest(sendMessageSchema), asyncHandler(send));
router.get("/:id", asyncHandler(getById));
router.patch("/:id", validateRequest(updateMessageSchema), asyncHandler(edit));
router.delete("/:id", asyncHandler(remove));

export default router;
