import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";
import loginAdmin from "../controller/admin/loginAdmin.js";
import addCourse from "../controller/admin/addCourse.js";
import addSection from "../controller/admin/addSection.js";
import fetchAllCourses from "../controller/admin/fetchAllCourses.js";
import fetchAllSections from "../controller/admin/fetchAllSections.js";
import addChapter from "../controller/admin/addChapter.js";
import fetchAllChapters from "../controller/admin/fetchAllChapters.js";
import addSubChapter from "../controller/admin/addSubChapter.js";
import fetchAllSubChapters from "../controller/admin/fetchAllSubChapters.js";
import addChapterQuestion from "../controller/admin/addChapterQuestion.js";
import fetchChapterTest from "../controller/admin/fetchChapterTest.js";
import addSectionQuestion from "../controller/admin/addSectionQuestion.js";
import fetchSectionTest from "../controller/admin/fetchSectionTest.js";
import obtainAccessToken from "../controller/admin/obtainAccessToken.js";

const adminRouter = Router();

/*
------- Router for admin
------- /api/admin/*
*/
adminRouter.post("/login", authenticateAPIKey, loginAdmin);
adminRouter.get("/access-token", obtainAccessToken);
adminRouter.post("/course", authorizeAdmin, addCourse);
adminRouter.post("/section", authorizeAdmin, addSection);
adminRouter.get("/course/list", authorizeAdmin, fetchAllCourses);
adminRouter.get("/section/list", authorizeAdmin, fetchAllSections);
adminRouter.post("/section/chapter", authorizeAdmin, addChapter);
adminRouter.get("/section/chapter/list", authorizeAdmin, fetchAllChapters);
adminRouter.post("/section/chapter/subchapter", authorizeAdmin, addSubChapter);
adminRouter.get(
  "/section/chapter/subchapter/list",
  authorizeAdmin,
  fetchAllSubChapters
);
adminRouter.post(
  "/section/chapter/question",
  authorizeAdmin,
  addChapterQuestion
);
adminRouter.get("/section/chapter/test", authorizeAdmin, fetchChapterTest);
adminRouter.post("/section/question", authorizeAdmin, addSectionQuestion);
adminRouter.get("/section/test", authorizeAdmin, fetchSectionTest);

export default adminRouter;
