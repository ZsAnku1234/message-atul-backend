import { Router } from "express";
import authRoutes from "./auth.routes";
import conversationRoutes from "./conversation.routes";
import mediaRoutes from "./media.routes";
import messageRoutes from "./message.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/users", userRoutes);
router.use("/media", mediaRoutes);

export default router;
