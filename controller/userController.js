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
 * @GET_ALL_MODULES_UNDER_COURSE
 * Fetches all modules under a specific course by courseId.
 */
export const getModulesUnderCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  // Find the course by ID and populate its modules
  const course = await Course.findById(courseId).populate("modules");

  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  console.log("Populated Course Data:", course); // Debugging

  res.status(200).json({
    success: true,
    message: "Modules retrieved successfully",
    modules: course.modules,
  });
});




/**
 * @GET_ALL_LESSONS_UNDER_MODULE    ------------------------------------GET ALL LESSONS UNDER THE COURSE ID AND MODULE ID------------------------------------------------
 * Retrieves all lessons under a specific module of a course.
 */
export const getAllLessonsUnderModule = asyncHandler(async (req, res, next) => {
  const { courseId, moduleId } = req.params; // Get courseId and moduleId from params

  // Find the course by ID
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // Find the module by ID within the course
  const module = await Module.findById(moduleId);
  if (!module) {
    return next(new AppError("Module not found", 404));
  }

  // Ensure that the module belongs to the specified course
  if (module.courseId.toString() !== courseId) {
    return next(new AppError("Module does not belong to this course", 400));
  }

  // Find all lessons under the module
  const lessons = await Lesson.find({ moduleId });

  res.status(200).json({
    success: true,
    message: "Lessons retrieved successfully",
    lessons, // Array of lessons
  });
});