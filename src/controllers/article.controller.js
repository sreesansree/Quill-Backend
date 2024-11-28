import Article from "../models/Article.model.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { body, validationResult } from "express-validator";

export const createArticle = async (req, res) => {
    // Validate request
  await body("title").notEmpty().withMessage("Title is required").run(req);
  await body("description")
    .isLength({ max: 255 })
    .withMessage("Description must not exceed 255 characters")
    .optional()
    .run(req);
  await body("content").notEmpty().withMessage("Content is required").run(req);
  await body("tags")
    .optional()
    .matches(/^[\w\s,]+$/)
    .withMessage("Tags should be a comma-separated list of words")
    .run(req);
  await body("category").notEmpty().withMessage("Category is required").run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, description, content, tags, category } = req.body;
    const userId = req.user.id;

    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "articles",
      });
      imageUrl = result.secure_url;
    }
    // create article
    const article = await Article.create({
      title,
      description,
      content,
      images: [imageUrl],
      tags: tags ? tags.split(",") : [],
      category,
      author: userId,
    });
    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating article", error: error.message });
  }
};

// Fetch user Articles
export const myArticles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const articles = await Article.find({ author: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ articles });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch articles", error });
  }
};

// Get Single myArticle

export const myArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ article });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch article", error });
  }
};

// Delete article
export const deleteMyArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;

    const article = await Article.findOneAndDelete({
      _id: articleId,
      author: userId,
    });
    if (!article) {
      return res
        .status(404)
        .json({ message: "Article not found or unauthorized" });
    }
    res.status(200).json({ message: "Article deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete article", error });
  }
};

// Update Article

export const editMyArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;
    console.log("Request Body: ", req.body);

    const updateArticle = await Article.findOneAndUpdate(
      {
        _id: articleId,
        author: userId,
      },
      { $set: req.body },
      { new: true, runValidators: true } // `new` returns the updated document, `runValidators` ensures schema validation
    );
    if (!updateArticle) {
      return res
        .status(404)
        .json({ message: "Article not found or unauthorized" });
    }
    res
      .status(200)
      .json({ message: "Article updated successfully", updateArticle });
  } catch (error) {
    res.status(500).json({ message: "Failed to update article", error });
  }
};

export const getArticlesByPreference = async (req, res) => {
  try {
    const { preferences } = req.user; // Extract preferences from the authenticated user

    // Ensure preferences exist and are valid
    if (
      !preferences ||
      !Array.isArray(preferences) ||
      preferences.length === 0
    ) {
      return res
        .status(200)
        .json({ message: "No preferences set by user", articles: [] });
    }


    // Find articles that match the user's preferences
    const articles = await Article.find({
      category: { $in: preferences }, // Match categories to user preferences
    })
      .populate("author", "firstName lastName") // Populate author details
      .sort({ createdAt: -1 }); // Sort articles by creation date (newest first)

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Error fetching articles", error });
  }
};
