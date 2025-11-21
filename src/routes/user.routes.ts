import { Router } from "express";
import { search } from "../controllers/user.controller";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/search", asyncHandler(search));

export default router;
