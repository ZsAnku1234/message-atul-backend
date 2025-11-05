import { Router } from "express";
import authRoutes from "./auth.routes";
import conversationRoutes from "./conversation.routes";
import messageRoutes from "./message.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);

export default router;
