import express from "express";
import {
  blockArticle,
  changePassword,
  dislikeArticle,
  likeArticle,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/update-profile", authenticateToken, updateUserProfile);
router.put("/change-password", authenticateToken, changePassword);

router.post("/:articleId/like", authenticateToken, likeArticle);
router.post("/:articleId/dislike", authenticateToken, dislikeArticle);
router.post("/:articleId/block", authenticateToken, blockArticle);

export default router;
