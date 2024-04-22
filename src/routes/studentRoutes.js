import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeStudent from "../middleware/authorizeStudent.js";
import getAllOfferedCourses from "../controller/student/getAllOfferedCourses.js";
import enrollStudent from "../controller/student/enrollStudent.js";
import loginStudent from "../controller/student/loginStudent.js";
import fetchSection from "../controller/student/fetchSection.js";
import fetchAllChapters from "../controller/student/fetchAllChapters.js";
import fetchAllSubChapters from "../controller/student/fetchAllSubChapters.js";
import fetchSectionTest from "../controller/student/fetchSectionTest.js";
import fetchChapterTest from "../controller/student/fetchChapterTest.js";
import generateSectionTestResult from "../controller/student/generateSectionTestResult.js";
import generateChapterTestResult from "../controller/student/generateChapterTestResult.js";
import obtainAccessToken from "../controller/student/obtainAccessToken.js";
import redeemCoupon from "../controller/student/redeemCoupon.js";
import checkStudentUserName from "../controller/student/checkStudentUserName.js";
import sendEmail from "../controller/student/sendEmail.js";
import completeSection from "../controller/student/completeSection.js";

const studentRouter = Router();

/*
------- Router for student
------- /api/student/*
*/
studentRouter.get("/enroll/courses", authenticateAPIKey, getAllOfferedCourses);
studentRouter.get("/access-token", obtainAccessToken);
studentRouter.get("/username", authenticateAPIKey, checkStudentUserName);
studentRouter.post("/send-email", authenticateAPIKey, sendEmail);
studentRouter.post("/enroll", authenticateAPIKey, enrollStudent);
studentRouter.post("/login", authenticateAPIKey, loginStudent);
studentRouter.post("/coupon", authenticateAPIKey, redeemCoupon);
studentRouter.get("/section", authorizeStudent, fetchSection);
studentRouter.get("/section/chapter/list", authorizeStudent, fetchAllChapters);
studentRouter.get(
  "/section/chapter/subchapter/list",
  authorizeStudent,
  fetchAllSubChapters
);
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
studentRouter.get("/section/completion", authorizeStudent, completeSection);

export default studentRouter;
