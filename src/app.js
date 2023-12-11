import express from "express";
import serverless from "serverless-http";
import superAdminRouter from "./routes/superAdminRoute.js";

const app = express();

app.use(express.json());
app.use("/api/superadmins", superAdminRouter);

export const handler = serverless(app);
