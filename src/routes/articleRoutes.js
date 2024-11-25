import express from "express";
import multer from "multer";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createArticle } from "../controllers/article.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/create",
  authenticateToken,
  upload.single("coverImage"),
  createArticle
);

export default router;
