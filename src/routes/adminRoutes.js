import { Router } from "express";
import rateLimit from "express-rate-limit";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";
import loginAdmin from "../controller/admin/loginAdmin.js";
import fetchAdmin from "../controller/admin/fetchAdmin.js";
import addAdmin from "../controller/admin/addAdmin.js";
import addCourse from "../controller/admin/addCourse.js";
import addSection from "../controller/admin/addSection.js";
import activateSection from "../controller/admin/activateSection.js";
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
import validateRefreshToken from "../controller/admin/validateRefreshToken.js";
import deleteQuestion from "../controller/admin/deleteQuestion.js";
import updateQuestion from "../controller/admin/updateQuestion.js";
import deleteStudent from "../controller/admin/deleteStudent.js";
import updateStudent from "../controller/admin/updateStudent.js";
import updateSubChaptersOrder from "../controller/admin/updateSubChaptersOrder.js";
import sendEmail from "../controller/admin/sendEmail.js";
import getResetPasswordCode from "../controller/admin/getResetPasswordCode.js";
import verifyResetPasswordCode from "../controller/admin/verifyResetPasswordCode.js";
import resetPassword from "../controller/admin/resetPassword.js";
import fetchStudentResults from "../controller/admin/fetchStudentResults.js";
import fetchStudentCompletions from "../controller/admin/fetchStudentCompletions.js";
import updatePassword from "../controller/admin/updatePassword.js";
import updateShownChapterQCount from "../controller/admin/updateShownChapterQCount.js";
import updateShownSectionQCount from "../controller/admin/updateShownSectionQCount.js";
import generateChapterImageSignedURL from "../controller/admin/generateChapterImageSignedURL.js";
import fetchSubChaptersProgress from "../controller/admin/fetchSubChaptersProgress.js";

const establishedRequestLimiter = () =>
  rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 5,
    message: "You can request send a request again after 2 minutes"
  });

const adminRouter = Router();

/*
------- Router for admin
------- /api/admin/*
*/
adminRouter.post("", authorizeAdmin, addAdmin);
adminRouter.get("", authorizeAdmin, fetchAdmin);
adminRouter.post("/login", authenticateAPIKey, loginAdmin);
adminRouter.post("/send-email", authenticateAPIKey, sendEmail);
adminRouter.get("/access-token", obtainAccessToken);
adminRouter.get("/refresh-token/validate", validateRefreshToken);
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
adminRouter.get(
  "/s3/presigned-url/chapter/put",
  authorizeAdmin,
  generateChapterImageSignedURL
);
adminRouter.get("/course/list", authorizeAdmin, fetchAllCourses);
adminRouter.patch("/course", authorizeAdmin, updateCourse);
adminRouter.delete("/course", authorizeAdmin, deleteCourse);
adminRouter.post("/section", authorizeAdmin, addSection);
adminRouter.get("/section", authorizeAdmin, fetchSectionByID);
adminRouter.patch("/section/title", authorizeAdmin, updateSectionTitle);
adminRouter.patch("/section/activate", authorizeAdmin, activateSection);
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
adminRouter.get(
  "/section/chapter/subchapter/progress/list",
  authorizeAdmin,
  fetchSubChaptersProgress
);
adminRouter.patch(
  "/section/chapter/subchapter/list/order",
  authorizeAdmin,
  updateSubChaptersOrder
);
adminRouter.post(
  "/section/chapter/question",
  authorizeAdmin,
  addChapterQuestion
);
adminRouter.get("/section/chapter/test", authorizeAdmin, fetchChapterTest);
adminRouter.post("/section/question", authorizeAdmin, addSectionQuestion);
adminRouter.get("/section/test", authorizeAdmin, fetchSectionTest);
adminRouter.delete("/question", authorizeAdmin, deleteQuestion);
adminRouter.patch("/question", authorizeAdmin, updateQuestion);
adminRouter.post("/student", authorizeAdmin, addStudent);
adminRouter.get(
  "/student/section/list",
  authorizeAdmin,
  fetchAllStudentSections
);
adminRouter.patch("/student", authorizeAdmin, updateStudent);
adminRouter.delete("/student", authorizeAdmin, deleteStudent);
adminRouter.patch("/student/status", authorizeAdmin, updateStudentStatus);
adminRouter.get("/student/all", authorizeAdmin, fetchAllStudentsPerSection);
adminRouter.get(
  "/student/test/result/list",
  authorizeAdmin,
  fetchStudentResults
);
adminRouter.get(
  "/student/completion/list",
  authorizeAdmin,
  fetchStudentCompletions
);
adminRouter.post("/coupon", authorizeAdmin, createCoupon);
adminRouter.delete("/coupon", authorizeAdmin, deleteCoupon);
adminRouter.patch("/coupon", authorizeAdmin, updateCoupon);
adminRouter.get("/coupon/list", authorizeAdmin, fetchAllCoupons);
adminRouter.get("/billing/list", authorizeAdmin, fetchAllBillingInfo);
adminRouter.get("/setting/site", authorizeAdmin, fetchSiteSettings);
adminRouter.patch("/setting/site", authorizeAdmin, updateSiteSettings);
adminRouter.get("/setting/email", authorizeAdmin, fetchEmailContent);
adminRouter.patch("/setting/email", authorizeAdmin, updateEmailContent);
adminRouter.patch("/password", authorizeAdmin, updatePassword);
adminRouter.get(
  "/reset-password/code",
  establishedRequestLimiter(),
  authenticateAPIKey,
  getResetPasswordCode
);
adminRouter.post(
  "/reset-password/code",
  establishedRequestLimiter(),
  authenticateAPIKey,
  verifyResetPasswordCode
);
adminRouter.patch("/reset-password", authenticateAPIKey, resetPassword);
adminRouter.patch(
  "/section/chapter/question/shown-count",
  authorizeAdmin,
  updateShownChapterQCount
);
adminRouter.patch(
  "/section/question/shown-count",
  authorizeAdmin,
  updateShownSectionQCount
);

export default adminRouter;
