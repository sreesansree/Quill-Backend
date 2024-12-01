import express from "express";
import {
  blockArticle,
  changePassword,
  dislikeArticle,
  getBlockedArticles,
  getDislikedAticles,
  getLikedArticles,
  likeArticle,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/update-profile", authenticateToken, updateUserProfile);
router.put("/change-password", authenticateToken, changePassword);

// Like, Dislike, Block
router.post("/:articleId/like", authenticateToken, likeArticle);
router.post("/:articleId/dislike", authenticateToken, dislikeArticle);
router.post("/:articleId/block", authenticateToken, blockArticle);

// Fetch user's articles
router.get("/liked", authenticateToken, getLikedArticles);
router.get("/disliked", authenticateToken, getDislikedAticles);
router.get("/blocked", authenticateToken, getBlockedArticles);

export default router;
