import bcrypt from "bcryptjs"; // For hashing passwords
import { User } from "../model/userModel.js"; // Import the User model
import { validationResult } from "express-validator"; // For validation
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Course from "../model/courseModel.js";
import Module from "../model/modulesModel.js";
import Lesson from "../model/lessonModel.js";

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


/**
 * @USER_GET_ASSIGNED_COURSES ------------------------------------GET ASSIGNED COURSES------------------------------------------------
 * Retrieves the courses assigned to the user.
 */
export const getAssignedCourses = asyncHandler(async (req, res, next) => {
  const { userId } = req.params; // Extract userId from request parameters

  // Check if the user exists
  const user = await User.findById(userId).populate('assignedCourses'); // Populate course details
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Ensure the user has assigned courses
  if (!user.assignedCourses || user.assignedCourses.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No assigned courses found for this user",
    });
  }

  res.status(200).json({
    success: true,
    message: "Assigned courses retrieved successfully",
    courses: user.assignedCourses, // Return only the assigned courses
  });
});

/**
 * @USER_GET_MODULES_UNDER_ASSIGNED_COURSE ----------------GET MODULES UNDER ASSIGNED COURSE-------------------
 * Retrieves the modules under a specific course assigned to the user.
 */
export const getModulesUnderAssignedCourse = asyncHandler(async (req, res, next) => {
  const { userId, courseId } = req.params; // Extract userId and courseId from request parameters

  // Check if the user exists
  const user = await User.findById(userId).populate('assignedCourses'); // Populate course details
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Ensure the user has assigned courses
  if (!user.assignedCourses || user.assignedCourses.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No assigned courses found for this user",
    });
  }

  // Check if the requested course is in the user's assigned courses
  const assignedCourse = user.assignedCourses.find(
    (course) => course._id.toString() === courseId
  );

  if (!assignedCourse) {
    return res.status(403).json({
      success: false,
      message: "Access denied. This course is not assigned to the user.",
    });
  }

  // Populate modules for the assigned course
  const courseWithModules = await Course.findById(courseId).populate('modules');
  if (!courseWithModules) {
    return next(new AppError("Course not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Modules retrieved successfully",
    modules: courseWithModules.modules, // Return only the modules under the course
  });
});

/**
 * @USER_GET_LESSONS_UNDER_MODULE ----------------GET LESSONS UNDER MODULE AND ASSIGNED COURSE----------------
 * Retrieves lessons under a specific module in a course assigned to the user.
 */
export const getLessonsUnderModule = asyncHandler(async (req, res, next) => {
  const { userId, courseId, moduleId } = req.params; // Extract userId, courseId, and moduleId from request parameters

  // Check if the user exists
  const user = await User.findById(userId).populate('assignedCourses'); // Populate assigned courses
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Ensure the user has assigned courses
  if (!user.assignedCourses || user.assignedCourses.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No assigned courses found for this user",
    });
  }

  // Check if the requested course is in the user's assigned courses
  const assignedCourse = user.assignedCourses.find(
    (course) => course._id.toString() === courseId
  );

  if (!assignedCourse) {
    return res.status(403).json({
      success: false,
      message: "Access denied. This course is not assigned to the user.",
    });
  }

  // Check if the module exists in the course
  const courseWithModules = await Course.findById(courseId).populate('modules');
  if (!courseWithModules) {
    return next(new AppError("Course not found", 404));
  }

  const module = courseWithModules.modules.find(
    (mod) => mod._id.toString() === moduleId
  );

  if (!module) {
    return res.status(404).json({
      success: false,
      message: "Module not found in the assigned course",
    });
  }

  // Populate lessons for the module
  const moduleWithLessons = await Module.findById(moduleId).populate('lessons');
  if (!moduleWithLessons) {
    return next(new AppError("Module not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Lessons retrieved successfully",
    lessons: moduleWithLessons.lessons, // Return lessons under the module
  });
});
