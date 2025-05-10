import express from "express";
import { deleteUser, getUser, getUsers, updateUser, savePost, profilePosts, getUserByPhoneNumber, getNotificationNumber } from "../controllers/user.controller.js";
import {verifyToken} from "../middleware/verifyToken.js"


const router = express.Router();

router.get("/", getUsers);

router.post("/save", verifyToken, savePost);

router.get("/profilePosts", verifyToken, profilePosts);

router.get("/phone/:phoneNumber",verifyToken, getUserByPhoneNumber);

router.get("/notification", verifyToken, getNotificationNumber)

router.get("/fetchUser/:id", verifyToken, getUser);

router.put("/:id", verifyToken, updateUser);

router.delete("/:id", verifyToken, deleteUser);



export default router;