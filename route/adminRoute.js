import express from "express";
import {
  register,
  login,
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  createModuleUnderCourse,
  getModulesUnderCourse,
  updateModuleUnderCourse,
  deleteModuleUnderCourse,
  createLessonUnderModule,
  getAllLessonsUnderModule,
  updateLessonUnderModule,
  deleteLessonUnderModule,
  getAllUsers,
  assignCourseToUser,
  deleteUserById,
  removeCourseFromUser,
} from "../controller/adminController.js";

const route = express.Router();

route.post("/register", register);
route.post("/login", login);
route.post("/createCourse", createCourse);
route.get("/getallcourses", getAllCourses);
route.get("/getCourseById/:id", getCourseById);
route.put("/updateCourseById/:id", updateCourseById);
route.delete("/deleteCourseById/:id", deleteCourseById);
route.post("/course/:courseId/createModuleUnderCourse",createModuleUnderCourse);
route.get("/course/:courseId/getModulesUnderCourse",getModulesUnderCourse);
route.put("/course/:courseId/module/updateModuleUnderCourse/:moduleId",updateModuleUnderCourse);
route.delete("/course/:courseId/module/deleteModuleUnderCourse/:moduleId",deleteModuleUnderCourse);
route.post("/course/:courseId/module/:moduleId/createLessonUnderModule",createLessonUnderModule);
route.get("/course/:courseId/module/:moduleId/getAllLessonsUnderModule",getAllLessonsUnderModule);
route.put("/course/:courseId/module/:moduleId/lesson/updateLessonUnderModule/:lessonId",updateLessonUnderModule);
route.delete("/course/:courseId/module/:moduleId/lesson/deleteLessonUnderModule/:lessonId",deleteLessonUnderModule);
route.get("/getAllUsers",getAllUsers);
route.delete("/deleteUserById/:userId",deleteUserById);
route.post("/assignCourseToUser", assignCourseToUser,);
route.delete("/:userId/removeCourseFromUser/:courseId", removeCourseFromUser);





export default route;
