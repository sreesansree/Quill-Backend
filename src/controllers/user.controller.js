import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import Article from "../models/Article.model.js";
import { errorHandler } from "../utils/error.js";

export const updateUserProfile = async (req, res, next) => {
  const { firstName, lastName, dob, phone, email, preferences } = req.body;
  const userId = req.user.id;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        dob,
        phone,
        email,
        preferences,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedUser) {
      next(errorHandler(404, "User not found"));
    }
    res.status(200).json({
      message: "Profile Updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(errorHandler(500, "Failed to update profile"));
  }
};

export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate inputs
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both current and new passwords are required." });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters long." });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "New password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
    const user = await User.findById(req.user.id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("isMatch", isMatch);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Check if new password is the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    next(error);
  }
};

/* Like Article */

export const likeArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Check if user already liked the article
    if (article.likes.some((id) => id.toString() === userId)) {
      return res
        .status(400)
        .json({ message: "You already liked this article" });
    }

    // Add user to likes and remove from dislikes if present
    article.likes.push(userId);
    article.dislikes = article.dislikes.filter(
      (id) => id.toString() !== userId
    );

    await article.save();

    return res.status(200).json({
      message: "Article liked successfully",
      article,
      likesCount: article.likes.length,
      dislikesCount: article.dislikes.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error liking the article",
      error: error.message,
    });
  }
};

/* Dislike Article */

export const dislikeArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Check if user already disliked the article
    if (article.dislikes.some((id) => id.toString() === userId)) {
      return res
        .status(400)
        .json({ message: "You already disliked this article" });
    }

    // Add user to dislikes and remove from likes if present
    article.dislikes.push(userId);
    article.likes = article.likes.filter((id) => id.toString() !== userId);

    await article.save();

    return res.status(200).json({
      message: "Article disliked successfully",
      article,
      likesCount: article.likes.length,
      dislikesCount: article.dislikes.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error disliking the article",
      error: error.message,
    });
  }
};

/* Block Article */

export const blockArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Add user to the blockedBy list
    if (!article.blocks.includes(userId)) {
      article.blocks.push(userId);
      await article.save();
    }

    res.status(200).json({ message: "Article blocked successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error blocking the article", error: error.message });
  }
};

/* Get Liked Articles */

export const getLikedArticles = async (req, res) => {
  try {
    const userId = req.user.id;
    const likedArticles = await Article.find({ likes: userId });
    res.status(200).json(likedArticles);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching liked articles", error: error.message });
  }
};

/* GEt disliked Articles */

export const getDislikedAticles = async (req, res) => {
  try {
    const userId = req.user.id;
    const dislikedArtcles = await Article.find({ dislikes: userId });
    res.status(200).json(dislikedArtcles);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching disliked articles",
      error: error.message,
    });
  }
};

/* Get Blocked Articles */

export const getBlockedArticles = async (req, res) => {
  try {
    const userId = req.user.id;
    const blockedArticles = await Article.find({ blocks: userId });
    res.status(200).json(blockedArticles);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching blocked Articles",
      error: error.message,
    });
  }
};
