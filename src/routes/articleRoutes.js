import express from "express";
import multer from "multer";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
  createArticle,
  deleteMyArticle,
  editMyArticle,
  getArticlesByPreference,
  myArticle,
  myArticles,
} from "../controllers/article.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/create",
  authenticateToken,
  upload.single("coverImage"),
  createArticle
);
router.get("/my-articles", authenticateToken, myArticles);
router.delete("/:id", authenticateToken, deleteMyArticle);
router.get("/:id", authenticateToken, myArticle);
router.put("/:id", authenticateToken, editMyArticle);

router.get("/preferences", authenticateToken, getArticlesByPreference);

export default router;
