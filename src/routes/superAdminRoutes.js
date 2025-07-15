import { Router } from "express";
import authorizeSuperAdmin from "../middleware/authorizeSuperAdmin.js";
import signUpSuperAdmin from "../controller/superAdmin/signUpSuperAdmin.js";
import createDrivingSchool from "../controller/superAdmin/createDrivingSchool.js";
import loginSuperAdmin from "../controller/superAdmin/logInSuperAdmin.js";
import resetAdminPassword from "../controller/superAdmin/resetAdminPassword.js";
import deleteAdmin from "../controller/superAdmin/deleteAdmin.js";
import fetchAllSuperAdmins from "../controller/superAdmin/fetchAllSuperAdmins.js";
import fetchAllAdmins from "../controller/superAdmin/fetchAllAdmins.js";
import authenticateAPIKey from "../middleware/authenticateAPIKey.js";
import obtainAccessToken from "../controller/superAdmin/obtainAccessToken.js";
import validateRefreshToken from "../controller/superAdmin/validateRefreshToken.js";

/*
------- Router for super admin
------- /api/superadmin/*
*/
const superAdminRouter = Router();

superAdminRouter.get("/", authorizeSuperAdmin, fetchAllSuperAdmins);
superAdminRouter.get("/access-token", obtainAccessToken);
superAdminRouter.get("/refresh-token/validate", validateRefreshToken);
superAdminRouter.post("/signup", authenticateAPIKey, signUpSuperAdmin);
superAdminRouter.post("/login", authenticateAPIKey, loginSuperAdmin);
superAdminRouter.post(
  "/driving-school",
  authorizeSuperAdmin,
  createDrivingSchool
);
superAdminRouter.delete("/admin", authorizeSuperAdmin, deleteAdmin);
superAdminRouter.patch(
  "/admin/password",
  authorizeSuperAdmin,
  resetAdminPassword
);
superAdminRouter.get("/fetch-admins", authorizeSuperAdmin, fetchAllAdmins);

export default superAdminRouter;
