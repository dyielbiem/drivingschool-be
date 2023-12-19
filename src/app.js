import express from "express";
import serverless from "serverless-http";
import superAdminRouter from "./routes/superAdminRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import studentRouter from "./routes/studentRoutes.js";

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-API-Key, Authorization, Content-Type"
  );
  next();
});
app.use(express.json());
app.use("/api/superadmin", superAdminRouter);
app.use("/api/admin", adminRouter);
app.use("/api/student", studentRouter);

export const handler = serverless(app);
