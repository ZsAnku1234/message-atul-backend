import { Router } from "express";
import { login, me, requestOtp } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, requestOtpSchema } from "../validators/auth.validator";

const router = Router();

router.post("/request-otp", validateRequest(requestOtpSchema), asyncHandler(requestOtp));
router.post("/login", validateRequest(loginSchema), asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));

export default router;
