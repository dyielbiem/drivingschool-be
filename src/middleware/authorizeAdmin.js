import jwt from "jsonwebtoken";

/*
---- Middleware for validation of super admin token
*/
const authorizeAdmin = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) throw Error;
    const token = authorization.split(" ")[1];

    const { adminID, adminUserName, drivingSchoolID } = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET
    );

    req.body.adminUserName = adminUserName;
    req.body.drivingSchoolID = drivingSchoolID;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authorizeAdmin;
