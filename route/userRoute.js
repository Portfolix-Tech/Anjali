import { registerUser,
    loginUser,
    getAssignedCourses,
    getModulesUnderAssignedCourse,
    getLessonsUnderModule,
    logoutUser,
   
 } from "../controller/userController.js";
import express from "express"

const userroute=express.Router();

userroute.post("/userregister",registerUser);
userroute.post("/userlogin",loginUser)
userroute.get("/:userId/getAssignedCourses",getAssignedCourses);
userroute.get("/:userId/course/:courseId/getModulesUnderAssignedCourse",getModulesUnderAssignedCourse);
userroute.get("/:userId/course/:courseId/module/:moduleId/getLessonsUnderModule",getLessonsUnderModule);
userroute.post("/userlogout",logoutUser);

export default userroute;

