import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    // console.log("Received Token:", token);
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user; // Attach user, including preferences
    next();
    // jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    //   if (err) {
    //     return res.status(403).json({ message: "Invalid token" });
    //   }
    //   req.user = user;
    //   next();
    // });
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};
