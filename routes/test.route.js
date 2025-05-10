import express from "express";
import { shouldBeLoggedAmin, shouldBeLoggedIn } from "../controllers/test.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get ("/should-be-logged-in", verifyToken, shouldBeLoggedIn)

router.get ("/should-be-admin", shouldBeLoggedAmin)

export default router;