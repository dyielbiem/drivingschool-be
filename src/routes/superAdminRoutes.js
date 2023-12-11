import { Router } from "express";
import superAdminMiddleware from "../middleware/superAdminMiddleware.js";
import signUpSuperAdmin from "../controller/superAdmin/signUpSuperAdmin.js";
import createAdmin from "../controller/superAdmin/createAdmin.js";
import loginSuperAdmin from "../controller/superAdmin/logInSuperAdmin.js";
import deleteAdmin from "../controller/superAdmin/deleteAdmin.js";
import fetchAllSuperAdmins from "../controller/superAdmin/fetchAllSuperAdmins.js";
import fetchAllAdmins from "../controller/superAdmin/fetchAllAdmins.js";

/*
------- Router for super admin
------- /api/superadmins/*
*/
const superAdminRouter = Router();

superAdminRouter.get("/", superAdminMiddleware, fetchAllSuperAdmins);
superAdminRouter.post("/signup", signUpSuperAdmin);
superAdminRouter.post("/login", loginSuperAdmin);
superAdminRouter.post("/create-admin", superAdminMiddleware, createAdmin);
superAdminRouter.delete("/delete-admin", superAdminMiddleware, deleteAdmin);
superAdminRouter.get("/fetch-admins", superAdminMiddleware, fetchAllAdmins);

export default superAdminRouter;
