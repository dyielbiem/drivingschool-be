import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeStudent from "../middleware/authorizeStudent.js";
import getAllOfferedCourses from "../controller/student/getAllOfferedCourses.js";
import enrollStudent from "../controller/student/enrollStudent.js";
import loginStudent from "../controller/student/loginStudent.js";
import fetchSectionTest from "../controller/student/fetchSectionTest.js";
import fetchChapterTest from "../controller/student/fetchChapterTest.js";
import generateSectionTestResult from "../controller/student/generateSectionTestResult.js";
import generateChapterTestResult from "../controller/student/generateChapterTestResult.js";

const studentRouter = Router();

/*
------- Router for student
------- /api/student/*
*/
studentRouter.get("/enroll/courses", authenticateAPIKey, getAllOfferedCourses);
studentRouter.post("/enroll", authenticateAPIKey, enrollStudent);
studentRouter.post("/login", authenticateAPIKey, loginStudent);
studentRouter.get("/section/test", authorizeStudent, fetchSectionTest);
studentRouter.get("/section/chapter/test", authorizeStudent, fetchChapterTest);
studentRouter.post(
  "/section/test/result",
  authorizeStudent,
  generateSectionTestResult
);
studentRouter.post(
  "/section/chapter/test/result",
  authorizeStudent,
  generateChapterTestResult
);

export default studentRouter;
