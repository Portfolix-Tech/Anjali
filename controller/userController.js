import bcrypt from "bcryptjs"; // For hashing passwords
import { User } from "../model/userModel.js"; // Import the User model
import { validationResult } from "express-validator"; // For validation

// Register User
export const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists." });
    }

    const newUser = new User({ username, email, password, role });
    await newUser.save();

    const token = newUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or username." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
