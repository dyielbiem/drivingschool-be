import jwt from "jsonwebtoken";

/*
---- Middleware for validation of admin token
*/
const authorizeAdmin = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw Error;
    const token = authorization.split(" ")[1];

    const { adminUserName, drivingSchoolID } = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET
    );

    if (!adminUserName || !drivingSchoolID) throw Error;

    req.body.adminUserName = adminUserName;
    req.body.drivingSchoolID = drivingSchoolID;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ error: "TokenExpiredError" });
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authorizeAdmin;
