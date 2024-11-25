import express from "express";

import {
  loginUser,
  logout,
  registerUser,
  requestOTP,
  resendOTP,
  resetPassword,
  verifyOTP,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

router.post("/login", loginUser);
router.post("/logout", authenticateToken, logout);

router.post("/request-otp", requestOTP);
router.post("/reset-password", resetPassword);


export default router;
