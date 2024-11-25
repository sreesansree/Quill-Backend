import Article from "../models/Article.model.js";
import cloudinary from "../config/cloudinaryConfig.js";

export const createArticle = async (req, res) => {
  try {
    const { title, description, content, tags, category } = req.body;
    const userId = req.user.id; // Assuming user is authenticated and ID is attached to req.user.
    // console.log("User IDDDD", userId);
    // Upload cover image to Cloudinary
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
