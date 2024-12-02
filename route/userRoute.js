import { registerUser,
    loginUser,
    getAssignedCourses,
    getModulesUnderCourse,
    getAllLessonsUnderModule,
 } from "../controller/userController.js";
import express from "express"

const userroute=express.Router();

userroute.post("/userregister",registerUser);
userroute.post("/userlogin",loginUser)
userroute.get("/:userId/getAssignedCourses",getAssignedCourses);
userroute.get("/course/:courseId/getModulesUnderCourse",getModulesUnderCourse);
userroute.get("/course/:courseId/module/:moduleId/getAllLessonsUnderModule",getAllLessonsUnderModule);



export default userroute;

