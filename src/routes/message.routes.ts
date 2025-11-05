import { Router } from "express";
import { send } from "../controllers/message.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { sendMessageSchema } from "../validators/message.validator";

const router = Router();

router.use(authenticate);
router.post("/", validateRequest(sendMessageSchema), asyncHandler(send));

export default router;
