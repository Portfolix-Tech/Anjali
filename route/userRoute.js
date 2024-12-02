import { registerUser,
    loginUser
 } from "../controller/userController.js";
import express from "express"

const userroute=express.Router();

userroute.post("/userregister",registerUser);
userroute.post("/userlogin",loginUser)

export default userroute;

