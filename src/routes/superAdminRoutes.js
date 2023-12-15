import { Router } from "express";
import authorizeSuperAdmin from "../middleware/authorizeSuperAdmin.js";
import signUpSuperAdmin from "../controller/superAdmin/signUpSuperAdmin.js";
import createDrivingSchool from "../controller/superAdmin/createDrivingSchool.js";
import loginSuperAdmin from "../controller/superAdmin/logInSuperAdmin.js";
import deleteAdmin from "../controller/superAdmin/deleteAdmin.js";
import fetchAllSuperAdmins from "../controller/superAdmin/fetchAllSuperAdmins.js";
import fetchAllAdmins from "../controller/superAdmin/fetchAllAdmins.js";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";

/*
------- Router for super admin
------- /api/superadmin/*
*/
const superAdminRouter = Router();

superAdminRouter.get("/", authorizeSuperAdmin, fetchAllSuperAdmins);
superAdminRouter.post("/signup", authenticateAPIKey, signUpSuperAdmin);
superAdminRouter.post("/login", authenticateAPIKey, loginSuperAdmin);
superAdminRouter.post(
  "/driving-school",
  authorizeSuperAdmin,
  createDrivingSchool
);
superAdminRouter.delete("/admin", authorizeSuperAdmin, deleteAdmin);
superAdminRouter.get("/fetch-admins", authorizeSuperAdmin, fetchAllAdmins);

export default superAdminRouter;
