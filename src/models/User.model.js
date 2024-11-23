import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
    },
    dob: {
      type: Date,
    },
    otp: {
      type: String,
      // required: true,
    },
    otpExpires: {
      type: Date,
    },
    preferences: [String],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
