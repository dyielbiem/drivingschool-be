import express from "express";
import serverless from "serverless-http";
import superAdminRouter from "./routes/superAdminRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import studentRouter from "./routes/studentRoutes.js";

const app = express();

app.use(express.json());
app.use("/api/superadmin", superAdminRouter);
app.use("/api/admin", adminRouter);
app.use("/api/student", studentRouter);

export const handler = serverless(app);
