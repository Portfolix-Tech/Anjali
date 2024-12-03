import { registerUser,
    loginUser,
    getAssignedCourses,
    getModulesUnderAssignedCourse,
    getLessonsUnderModule
   
 } from "../controller/userController.js";
import express from "express"

const userroute=express.Router();

userroute.post("/userregister",registerUser);
userroute.post("/userlogin",loginUser)
userroute.get("/:userId/getAssignedCourses",getAssignedCourses);
userroute.get("/:userId/course/:courseId/getModulesUnderAssignedCourse",getModulesUnderAssignedCourse);
userroute.get("/:userId/course/:courseId/module/:moduleId/getLessonsUnderModule",getLessonsUnderModule);


export default userroute;

