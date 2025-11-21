import { Router } from "express";
import { uploadMedia } from "../controllers/media.controller";
import { authenticate } from "../middlewares/authenticate";
import { mediaUpload } from "../middlewares/mediaUpload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/", authenticate, mediaUpload, asyncHandler(uploadMedia));

export default router;
