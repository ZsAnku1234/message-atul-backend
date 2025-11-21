import { Router } from "express";
import {
  addParticipants,
  create,
  destroy,
  getById,
  getMessages,
  list,
  removeParticipant,
  setAdminMessageControl,
  update,
  updateAdmins
} from "../controllers/conversation.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createConversationSchema,
  modifyParticipantsSchema,
  updateAdminsSchema,
  updateConversationSchema,
  messageControlSchema
} from "../validators/conversation.validator";

const router = Router();

router.use(authenticate);

router.post("/", validateRequest(createConversationSchema), asyncHandler(create));
router.get("/", asyncHandler(list));
router.get("/:id/messages", asyncHandler(getMessages));
router.get("/:id", asyncHandler(getById));
router.patch("/:id", validateRequest(updateConversationSchema), asyncHandler(update));
router.patch("/:id/admins", validateRequest(updateAdminsSchema), asyncHandler(updateAdmins));
router.patch(
  "/:id/message-control",
  validateRequest(messageControlSchema),
  asyncHandler(setAdminMessageControl)
);
router.post(
  "/:id/participants",
  validateRequest(modifyParticipantsSchema),
  asyncHandler(addParticipants)
);
router.delete("/:id/participants/:userId", asyncHandler(removeParticipant));
router.delete("/:id", asyncHandler(destroy));

export default router;
