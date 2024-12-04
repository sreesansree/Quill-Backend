import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {} from "express-validator";
import { generateOTP } from "../utils/otpService.js";
import sendEmail from "../utils/sendEmail.js";
import { errorHandler } from "../utils/error.js";
import moment from "moment";

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

export const registerUser = async (req, res, next) => {
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
  console.log("req body", req.body);
  try {
    if (!firstName || firstName === " ") {
      next(errorHandler(400, "First name required"));
    }
    if (!lastName || lastName === " ") {
      next(errorHandler(400, "Last name required"));
    }
    if (!email || email === " ") {
      next(errorHandler(400, "Email required"));
    }
    if (!phone || phone === " ") {
      next(errorHandler(400, "phone required"));
    }
    if (!password || password === " ") {
      next(errorHandler(400, "password required"));
    }
    if (!confirmPassword || confirmPassword === " ") {
      next(errorHandler(400, "Confirm password required"));
    }
    if (!dob || dob === " ") {
      next(errorHandler(400, "dob required"));
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      // throw new Error("Passwords do not match");
      next(errorHandler(400, "Passwords do not match"));
    }
    // Validate date of birth
    const birthDate = moment(dob);
    const age = moment().diff(birthDate, "years");
    if (age < 12) {
      return next(errorHandler(400, "You must be at least 12 years old"));
    }

    const userExists = await User.findOne({ email });
    const userPhoneExists = await User.findOne({ phone });
    if (userExists) {
      // throw new Error("User already Exists");
      next(errorHandler(400, "User already Exists"));
    }
    if (userPhoneExists) {
      // throw new Error("User already Exists");
      next(errorHandler(400, "Mobile number already Exists"));
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
    // res.status(400).json({ message: error.message });
    next(error.message);
  }
};

export const resendOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = temporaryUserData[email];
    if (!user) {
      // throw new Error("User not found or OTP already verified");
      return next(errorHandler(400, "User not found or OTP already verified."));
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 600000; // 10 minutes

    const subject = "Quill Verification - Resend OTP";
    const message = `Your new OTP code is ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, message);

    res.status(200).json({ message: "OTP resend successfully" });
  } catch (error) {
    // res.status(400).json({ message: error.message });
    next(errorHandler(400, error.message));
  }
};

export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const user = temporaryUserData[email];

    if (!user) {
      // throw new Error("User not found");
      return next(errorHandler(400, "User not found."));
    }
    if (user.otpExpires < Date.now()) {
      // throw new Error("OTP has expired");
      return next(errorHandler(400, "OTP has expired."));
    }
    if (user.otp !== otp) {
      // throw new Error("Invalid OTP");
      return next(errorHandler(400, "Invalid OTP."));
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
    // res.status(400).json({ message: error.message });
    next(errorHandler(400, error.message));
  }
};

export const loginUser = async (req, res, next) => {
  const { credential, password } = req.body;
  try {
    // Determine if the credential is an email or mobile
    const isEmail = /\S+@\S+\.\S+/.test(credential);
    const user = await User.findOne(
      isEmail ? { email: credential } : { phone: credential }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        dob: user.dob,
        phone: user.phone,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

export const requestOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      next(errorHandler(400, "User not found"));
    }
    const OTP = generateOTP();
    user.otp = OTP;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    const subject = "Quill Verification - Forget password";
    const message = `Your OTP code is ${OTP}. It will expire in 10 minutes. Please enter this code to verify your account.`;

    await sendEmail(email, subject, message);
    res.status(200).json({ message: "OTP Send to your email" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
