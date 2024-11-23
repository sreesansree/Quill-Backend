import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {} from "express-validator";
import { generateOTP } from "../utils/otpService.js";
import sendEmail from "../utils/sendEmail.js";

let temporaryUserData = {};

const categoryOptions = [
  "Technology",
  "Health",
  "Sports",
  "Politics",
  "Business",
  "Education",
  "Lifestyle",
  "Travel",
  "Food",
  "Science",
  "Entertainment",
];

export const registerUser = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    confirmPassword,
    dob,
    preferences,
  } = req.body;
  try {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword ||
      !dob ||
      firstName === "" ||
      lastName === "" ||
      email === "" ||
      phone === "" ||
      password === "" ||
      confirmPassword === "" ||
      dob
    ) {
      throw new Error("All fields are required");
    }
    // Check if passwords match
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    const userExists = await User.findOne({ email });
    console.log("user exists", userExists);
    if (userExists) {
      throw new Error("User already Exists");
    }

    // Validate preferences
    const invalidPreferences = preferences.filter(
      (preference) => !categoryOptions.includes(preference)
    );
    if (invalidPreferences.length > 0) {
      throw new Error(`Invalid preferences: ${invalidPreferences.join(", ")}`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate OTP
    const otp = generateOTP();

    temporaryUserData[email] = {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      dob,
      preferences,
      otp,
      otpExpires: Date.now() + 600000, // 10 minutes
    };

    const subject = "Quill Verification";
    const message = `Your OTP code is ${otp}. It will expire in 10 minutes. Please enter this code to verify your account.`;

    await sendEmail(email, subject, message);

    res.status(200).json({ message: "OTP sent successfully" });
    // return temporaryUserData[email];
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = temporaryUserData[email];
    if (!user) {
      throw new Error("User not found or OTP already verified");
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 600000; // 10 minutes

    const subject = "Quill Verification - Resend OTP";
    const message = `Your new OTP code is ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, message);

    res.status(200).json({ message: "OTP resend successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = temporaryUserData[email];

    if (!user) {
      throw new Error("User not found");
    }
    if (user.otpExpires < Date.now()) {
      throw new Error("OTP has expired");
    }
    if (user.otp !== otp) {
      throw new Error("Invalid OTP");
    }
    // Save user to the database
    const newUser = new User({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: user.password,
      dob: user.dob,
      preferences: user.preferences,
    });
    await newUser.save();

    // Cleanup temporary data
    if (newUser) {
      delete temporaryUserData[email];
    }

    res
      .status(200)
      .json({ message: "Account verified and registered successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {};
