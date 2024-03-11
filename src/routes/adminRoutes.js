import { Router } from "express";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";
import loginAdmin from "../controller/admin/loginAdmin.js";
import addCourse from "../controller/admin/addCourse.js";
import addSection from "../controller/admin/addSection.js";
import fetchAllCourses from "../controller/admin/fetchAllCourses.js";
import fetchSectionByID from "../controller/admin/fetchSectionByID.js";
import fetchAllSections from "../controller/admin/fetchAllSections.js";
import addChapter from "../controller/admin/addChapter.js";
import updateChapterContent from "../controller/admin/updateChapterContent.js";
import fetchAllChapters from "../controller/admin/fetchAllChapters.js";
import fetchChapterByID from "../controller/admin/fetchChapterByID.js";
import addSubChapter from "../controller/admin/addSubChapter.js";
import fetchAllSubChapters from "../controller/admin/fetchAllSubChapters.js";
import addChapterQuestion from "../controller/admin/addChapterQuestion.js";
import fetchChapterTest from "../controller/admin/fetchChapterTest.js";
import addSectionQuestion from "../controller/admin/addSectionQuestion.js";
import fetchSectionTest from "../controller/admin/fetchSectionTest.js";
import obtainAccessToken from "../controller/admin/obtainAccessToken.js";
import createCoupon from "../controller/admin/createCoupon.js";
import fetchAllCoupons from "../controller/admin/fetchAllCoupons.js";
import fetchAllBillingInfo from "../controller/admin/fetchAllBillingInfo.js";
import fetchAllStudentSections from "../controller/admin/fetchAllStudentSections.js";
import fetchAllStudentsPerSection from "../controller/admin/fetchAllStudentsPerSection.js";
import fetchSubChapterByID from "../controller/admin/fetchSubChapterByID.js";
import updateSubChapterContent from "../controller/admin/updateSubChapterContent.js";
import generateImageSignedURL from "../controller/admin/generateImageSignedURL.js";
import fetchAllUploadedImageKey from "../controller/admin/fetchAllUploadedImageKey.js";
import deleteChapter from "../controller/admin/deleteChapter.js";
import deleteSubChapter from "../controller/admin/deleteSubChapter.js";
import deleteCoupon from "../controller/admin/deleteCoupon.js";
import updateCoupon from "../controller/admin/updateCoupon.js";
import deleteCourse from "../controller/admin/deleteCourse.js";
import updateCourse from "../controller/admin/updateCourse.js";
import updateStudentStatus from "../controller/admin/updateStudentStatus.js";
import updateSectionTitle from "../controller/admin/updateSectionTitle.js";
import updateChapterTitle from "../controller/admin/updateChapterTitle.js";
import updateSubChapterTitle from "../controller/admin/updateSubChapterTitle.js";
import addStudent from "../controller/admin/addStudent.js";
import fetchSiteSettings from "../controller/admin/fetchSiteSettings.js";
import updateSiteSettings from "../controller/admin/updateSiteSettings.js";
import fetchEmailContent from "../controller/admin/fetchEmailContent.js";
import updateEmailContent from "../controller/admin/updateEmailContent.js";
import generateCourseImageSignedURL from "../controller/admin/generateCourseImageSignedURL.js";

const adminRouter = Router();

/*
------- Router for admin
------- /api/admin/*
*/
adminRouter.post("/login", authenticateAPIKey, loginAdmin);
adminRouter.get("/access-token", obtainAccessToken);
adminRouter.get(
  "/s3/presigned-url/put",
  authorizeAdmin,
  generateImageSignedURL
);
adminRouter.get("/s3/image/key/list", authorizeAdmin, fetchAllUploadedImageKey);
adminRouter.post("/course", authorizeAdmin, addCourse);
adminRouter.get(
  "/s3/presigned-url/course/put",
  authorizeAdmin,
  generateCourseImageSignedURL
);
adminRouter.get("/course/list", authorizeAdmin, fetchAllCourses);
adminRouter.patch("/course", authorizeAdmin, updateCourse);
adminRouter.delete("/course", authorizeAdmin, deleteCourse);
adminRouter.post("/section", authorizeAdmin, addSection);
adminRouter.get("/section", authorizeAdmin, fetchSectionByID);
adminRouter.patch("/section/title", authorizeAdmin, updateSectionTitle);
adminRouter.get("/section/list", authorizeAdmin, fetchAllSections);
adminRouter.post("/section/chapter", authorizeAdmin, addChapter);
adminRouter.delete("/section/chapter", authorizeAdmin, deleteChapter);
adminRouter.patch("/section/chapter/title", authorizeAdmin, updateChapterTitle);
adminRouter.patch(
  "/section/chapter/content",
  authorizeAdmin,
  updateChapterContent
);
adminRouter.get("/section/chapter/list", authorizeAdmin, fetchAllChapters);
adminRouter.get("/section/chapter", authorizeAdmin, fetchChapterByID);
adminRouter.get(
  "/section/chapter/subchapter",
  authorizeAdmin,
  fetchSubChapterByID
);
adminRouter.patch(
  "/section/chapter/subchapter/content",
  authorizeAdmin,
  updateSubChapterContent
);
adminRouter.patch(
  "/section/chapter/subchapter/title",
  authorizeAdmin,
  updateSubChapterTitle
);
adminRouter.post("/section/chapter/subchapter", authorizeAdmin, addSubChapter);
adminRouter.delete(
  "/section/chapter/subchapter",
  authorizeAdmin,
  deleteSubChapter
);
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
adminRouter.post("/student", authorizeAdmin, addStudent);
adminRouter.get(
  "/student/section/list",
  authorizeAdmin,
  fetchAllStudentSections
);
adminRouter.patch("/student/status", authorizeAdmin, updateStudentStatus);
adminRouter.get("/student/all", authorizeAdmin, fetchAllStudentsPerSection);
adminRouter.post("/coupon", authorizeAdmin, createCoupon);
adminRouter.delete("/coupon", authorizeAdmin, deleteCoupon);
adminRouter.patch("/coupon", authorizeAdmin, updateCoupon);
adminRouter.get("/coupon/list", authorizeAdmin, fetchAllCoupons);
adminRouter.get("/billing/list", authorizeAdmin, fetchAllBillingInfo);
adminRouter.get("/setting/site", authorizeAdmin, fetchSiteSettings);
adminRouter.patch("/setting/site", authorizeAdmin, updateSiteSettings);
adminRouter.get("/setting/email", authorizeAdmin, fetchEmailContent);
adminRouter.patch("/setting/email", authorizeAdmin, updateEmailContent);

export default adminRouter;
