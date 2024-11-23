import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../src/config/dbConfig.js";
import authRoutes from "../src/routes/authRoutes.js";

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(express.json({ extended: true, limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hai Sreee");
});
const options = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(options));

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port : ⚡ ${PORT} ⚡`);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || " Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
