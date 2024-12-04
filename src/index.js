import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../src/config/dbConfig.js";
import authRoutes from "../src/routes/authRoutes.js";
import articleRoutes from "../src/routes/articleRoutes.js";
import userRoutes from "../src/routes/userRoutes.js";

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(express.json({ extended: true, limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

const options = {
  origin: ["http://localhost:5173", "https://quill-frontend-nine.vercel.app"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  preflightContinue: false, // This ensures the CORS middleware handles the preflight request
  optionsSuccessStatus: 204, // HTTP 204 success status for preflight
};
app.use(cors(options));

app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.use("/api/auth", authRoutes);
app.use("/api/articles/", articleRoutes);
app.use("/api/user", userRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port : ⚡ ${PORT} ⚡`);
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// function to handle error
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || " Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
