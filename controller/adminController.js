import { Admin } from "../model/adminModel.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import bcrypt from "bcrypt";
import AppError from "../utils/error.util.js";
import Course from "../model/courseModel.js";
import Module from "../model/modulesModel.js";
import Lesson from "../model/lessonModel.js";
import { User } from "../model/userModel.js";

/**
 * @ADMIN  - Registers a new admin ------------------------------------REGISTER------------------------------------------------
 */
export const register = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return next(new AppError("Admin with this email already exists", 409));
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ email, password: hashedPassword });

  if (!admin) {
    return next(
      new AppError("Admin registration failed. Please try again.", 400)
    );
  }

  res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    admin: {
      id: admin._id,
      email: admin.email,
    },
  });
});

/**
 * @ADMIN  - Authenticates an admin------------------------------------LOGIN------------------------------------------------
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const admin = await Admin.findOne({ email });
  console.log("Admin found:", admin);
  if (!admin) {
    console.log(`Admin not found for email: ${email}`);
    return next(new AppError("Invalid email or password", 401));
  }

  console.log("Stored password hash:", admin.password);
  console.log("Entered password:", password);

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  console.log("Password comparison result:", isPasswordValid);
  if (!isPasswordValid) {
    return next(new AppError("Invalid email or password", 401));
  }
  // Generate token after successful login
  const token = admin.generateAuthToken();

  res.status(200).json({
    success: true,
    message: "Admin logged in successfully",
    admin: {
      id: admin._id,
      email: admin.email,
    },
    token,
  });
});

/**
 * @CREATE_COURSE ------------------------------------CREATE COURSE------------------------------------------------
 * Creates a new course and optionally uploads a thumbnail image.
 */
export const createCourse = asyncHandler(async (req, res, next) => {
  const { title, description, createdBy } = req.body;
  if (!title || !description || !createdBy) {
    return next(new AppError("Alll fields are required ", 400));
  }

  const course = await Course.create({
    title,
    description,
    createdBy,
    thumbnail: {
      public_id: "Dummy",
      secure_url: "Dummy",
    },
  });

  if (!course) {
    return next(
      new AppError("Course could not created please try again  ", 500)
    );
  }
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });
      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course created sucesssfully ",
      course,
    });
  }
});

/**
 * @GET_ALL_COURSES ------------------------------------GET ALL COURSE------------------------------------------------
 * Fetches all courses from the database.
 */
export const getAllCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find();

  if (!courses || courses.length === 0) {
    return next(new AppError("No courses found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Courses fetched successfully",
    courses,
  });
});

/**
 * @GET_COURSE_BY_ID
 * Fetches a specific course by its ID from the database.
 */
export const getCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find the course by ID
  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Course fetched successfully",
    course,
  });
});

/**
 * @UPDATE_COURSE_BY_ID ------------------------------------UPDATE COURSE BY ID------------------------------------------------
 * Updates a course by its ID.
 */
export const updateCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  // Validate input
  if (!title || !description) {
    return next(
      new AppError(
        "All fields (title, description, createdBy) are required",
        400
      )
    );
  }

  // Find the course by ID
  let course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // Update the course fields
  course.title = title;
  course.description = description;

  // If a new thumbnail is uploaded, upload it to Cloudinary
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      if (result) {
        // If there's an existing thumbnail, remove it from Cloudinary before updating
        if (course.thumbnail.public_id !== "Dummy") {
          await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
        }

        // Update the thumbnail information
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;

        // Clean up the local file
        fs.rmSync(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  }

  // Save the updated course
  await course.save();

  // Send response
  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    course,
  });
});

/**
 * @DELETE_COURSE_BY_ID   ------------------------------------DELETE COURSE NY ID------------------------------------------------
 * Deletes a course by its ID from the database.
 */
export const deleteCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find the course by ID
  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // Optionally delete the thumbnail from Cloudinary (if it exists)
  if (course.thumbnail.public_id !== "Dummy") {
    try {
      await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
    } catch (error) {
      return next(
        new AppError("Error deleting thumbnail from Cloudinary", 500)
      );
    }
  }

  // Delete the course
  await Course.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});

/**
 * @CREATE_MODULE_UNDER_COURSE        ------------------------------------CREATE MODULE UNDER THE COURSE ID------------------------------------------------
 * Creates a new module under a specific course by courseId.
 */
export const createModuleUnderCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { title, content } = req.body;

  // Validate input
  if (!title || !content) {
    return next(new AppError("Title and content are required", 400));
  }

  // Find the course by ID
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // Create a new module
  const newModule = new Module({
    courseId: courseId,
    title,
    content,
  });
  await newModule.save();
  // Add the module to the course
  if (course.modules) {
    course.modules.push(newModule._id);
  } else {
    course.modules = [newModule];
  }

  // Save the course with the new module
  await course.save();

  res.status(201).json({
    success: true,
    message: "Module created successfully under the course",
    module: newModule,
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



// ------------------------------------------------UPDATE MODULE UNDER COURE----------------------------------------

export const updateModuleUnderCourse = asyncHandler(async (req, res, next) => {
  const { courseId, moduleId } = req.params; // Expecting moduleId to identify the module to update
  const { title, content } = req.body;

  // Validate input
  if (!title || !content) {
    return next(new AppError("Title and content are required", 400));
  }

  // Find the course by ID
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // Find the module by ID under the course
  const existingModule = await Module.findById(moduleId);
  if (!existingModule) {
    return next(new AppError("Module not found", 404));
  }

  // Ensure the module is part of this course (optional)
  if (!course.modules.includes(existingModule._id)) {
    return next(new AppError("Module does not belong to this course", 400));
  }

  // Update the module's title and content
  existingModule.title = title;
  existingModule.content = content;

  // Save the updated module
  await existingModule.save();

  res.status(200).json({
    success: true,
    message: "Module updated successfully under the course",
    module: existingModule,
  });
});

/**
 * @DELETE_MODULE_UNDER_COURSE        ------------------------------------DELETE MODULE UNDER THE COURSE ID------------------------------------------------
 * Deletes a module under a specific course by courseId and moduleId.
 */
export const deleteModuleUnderCourse = asyncHandler(async (req, res, next) => {
  const { courseId, moduleId } = req.params; // Get courseId and moduleId from params

  // Find the course by ID
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // Find the module to delete by ID
  const moduleToDelete = await Module.findById(moduleId);
  if (!moduleToDelete) {
    return next(new AppError("Module not found", 404));
  }

  // Ensure the module is part of this course
  if (!course.modules.includes(moduleToDelete._id)) {
    return next(new AppError("Module does not belong to this course", 400));
  }

  // Remove the module from the course's modules array
  course.modules = course.modules.filter(
    (moduleId) => moduleId.toString() !== moduleToDelete._id.toString()
  );

  // Save the updated course
  await course.save();

  // Delete the module from the database
  await Module.findByIdAndDelete(moduleId);

  res.status(200).json({
    success: true,
    message: "Module deleted successfully from the course",
  });
});

/**
 * @CREATE_LESSON_UNDER_MODULE    ------------------------------------CREATE LESSON UNDER THE COURSE ID AND MODULE ID------------------------------------------------
 * Creates a new lesson under a specific module of a course.
 */
export const createLessonUnderModule = asyncHandler(async (req, res, next) => {
  const { courseId, moduleId } = req.params; // Get courseId and moduleId from params
  const { title, videoUrl } = req.body;

  // Validate input
  if (!title || !videoUrl) {
    return next(new AppError("Title, and video URL are required", 400));
  }

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

  // Create a new lesson under the module
  const newLesson = new Lesson({
    moduleId, // Associate with the course
    title,
    videoUrl, // URL of the lesson video
  });

  await newLesson.save();

  // Optionally, you can add the lesson to the module (if you are using a `lessons` field in Module schema)
  if (module.lessons) {
    module.lessons.push(newLesson._id);
  } else {
    module.lessons = [newLesson._id];
  }

  // Save the updated module with the new lesson
  await module.save();

  res.status(201).json({
    success: true,
    message: "Lesson created successfully under the module",
    lesson: newLesson,
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

/**
 * @UPDATE_LESSON_UNDER_MODULE    ------------------------------------UPDATE LESSON UNDER THE COURSE ID AND MODULE ID------------------------------------------------
 * Updates an existing lesson under a specific module of a course.
 */
export const updateLessonUnderModule = asyncHandler(async (req, res, next) => {
  const { courseId, moduleId, lessonId } = req.params; // Get courseId, moduleId, and lessonId from params
  const { title, videoUrl } = req.body;

  // Validate input
  if (!title || !videoUrl) {
    return next(new AppError("Title and video URL are required", 400));
  }

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

  // Find the lesson to update by ID
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new AppError("Lesson not found", 404));
  }

  // Ensure that the lesson belongs to the module
  if (lesson.moduleId.toString() !== moduleId) {
    return next(new AppError("Lesson does not belong to this module", 400));
  }

  // Update the lesson details
  lesson.title = title;
  lesson.videoUrl = videoUrl;

  // Save the updated lesson
  await lesson.save();

  res.status(200).json({
    success: true,
    message: "Lesson updated successfully under the module",
    lesson,
  });
});

/**
 * @DELETE_LESSON_UNDER_MODULE    ------------------------------------DELETE LESSON UNDER THE COURSE ID AND MODULE ID------------------------------------------------
 * Deletes a lesson under a specific module of a course.
 */
export const deleteLessonUnderModule = asyncHandler(async (req, res, next) => {
  const { courseId, moduleId, lessonId } = req.params; // Get courseId, moduleId, and lessonId from params

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

  // Find the lesson to delete by ID
  const lessonToDelete = await Lesson.findById(lessonId);
  if (!lessonToDelete) {
    return next(new AppError("Lesson not found", 404));
  }

  // Ensure that the lesson belongs to the specified module
  if (lessonToDelete.moduleId.toString() !== moduleId) {
    return next(new AppError("Lesson does not belong to this module", 400));
  }

  // Remove the lesson ID from the module's lessons array (if present)
  module.lessons = module.lessons.filter(
    (lessonId) => lessonId.toString() !== lessonToDelete._id.toString()
  );

  // Save the updated module
  await module.save();

  // Delete the lesson from the database
  await Lesson.findByIdAndDelete(lessonId);

  res.status(200).json({
    success: true,
    message: "Lesson deleted successfully from the module",
  });
});

/**
 * @ADMIN_GET_ALL_USERS ------------------------------------GET ALL REGISTERED USERS------------------------------------------------
 * Fetches all registered users for the admin.
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}, { password: 0 }); // Exclude password from the response

  if (!users || users.length === 0) {
    return next(new AppError("No users found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    users,
  });
});

/**
 * @ADMIN_ASSIGN_COURSE ------------------------------------ASSIGN COURSE TO USER------------------------------------------------
 * Assigns a course to a user.
 */
export const assignCourseToUser = asyncHandler(async (req, res, next) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    return next(new AppError("User ID and Course ID are required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  if (user.assignedCourses.includes(courseId)) {
    return next(new AppError("Course already assigned to the user", 400));
  }

  user.assignedCourses.push(courseId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Course assigned to user successfully",
    user,
  });
});

/**
 * @ADMIN_DELETE_USER ------------------------------------DELETE USER BY ID------------------------------------------------
 * Deletes a user from the database based on their ID.
 */
export const deleteUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params; // Get the user ID from the request parameters

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Delete the user
  await User.deleteOne({_id:userId});

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    userId,
  });
});


/**
 * @ADMIN_REMOVE_COURSE ------------------------------------REMOVE COURSE FROM USER------------------------------------------------
 * Removes a course assigned to a user.
 */
export const removeCourseFromUser = asyncHandler(async (req, res, next) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    return next(new AppError("User ID and Course ID are required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check if the course is assigned to the user
  const courseIndex = user.assignedCourses.indexOf(courseId);
  if (courseIndex === -1) {
    return next(new AppError("Course is not assigned to this user", 400));
  }

  // Remove the course from the user's assignedCourses array
  user.assignedCourses.splice(courseIndex, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Course removed from user successfully",
    user,
  });
});


