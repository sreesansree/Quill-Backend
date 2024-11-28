import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
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
    return res.status(400).json({ message: "Both current and new passwords are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long." });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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
    console.log("isMatch",isMatch)
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
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

