import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";
import loginAdmin from "../controller/admin/loginAdmin.js";
import addCourse from "../controller/admin/addCourse.js";
import addSection from "../controller/admin/addSection.js";
import fetchAllSections from "../controller/admin/fetchAllSections.js";
import addChapter from "../controller/admin/addChapter.js";
import fetchAllChapters from "../controller/admin/fetchALlChapters.js";
import addSubChapter from "../controller/admin/addSubChapter.js";
import fetchAllSubChapters from "../controller/admin/fetchAllSubChapters.js";
import addChapterQuestion from "../controller/admin/addChapterQuestion.js";
import fetchChapterTest from "../controller/admin/fetchChapterTest.js";
import addSectionQuestion from "../controller/admin/addSectionQuestion.js";
import fetchSectionTest from "../controller/admin/fetchSectionTest .js";

const adminRouter = Router();

/*
------- Router for admin
------- /api/admin/*
*/
adminRouter.post("/login", authenticateAPIKey, loginAdmin);
adminRouter.post("/course", authorizeAdmin, addCourse);
adminRouter.post("/section", authorizeAdmin, addSection);
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
