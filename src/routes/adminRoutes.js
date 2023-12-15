import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";
import loginAdmin from "../controller/admin/loginAdmin.js";
import addCourse from "../controller/admin/addCourse.js";

const adminRouter = Router();

/*
------- Router for admin
------- /api/admin/*
*/
adminRouter.post("/login", authenticateAPIKey, loginAdmin);
adminRouter.post("/course", authorizeAdmin, addCourse);

export default adminRouter;
