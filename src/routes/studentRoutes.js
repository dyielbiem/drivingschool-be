import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import getAllOfferedCourses from "../controller/student/getAllOfferedCourses.js";

const studentRouter = Router();

/*
------- Router for student
------- /api/student/*
*/
studentRouter.get("/enroll/courses", authenticateAPIKey, getAllOfferedCourses);

export default studentRouter;
