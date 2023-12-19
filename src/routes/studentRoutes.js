import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import getAllOfferedCourses from "../controller/student/getAllOfferedCourses.js";
import enrollStudent from "../controller/student/enrollStudent.js";

const studentRouter = Router();

/*
------- Router for student
------- /api/student/*
*/
studentRouter.get("/enroll/courses", authenticateAPIKey, getAllOfferedCourses);
studentRouter.post("/enroll", authenticateAPIKey, enrollStudent);

export default studentRouter;
