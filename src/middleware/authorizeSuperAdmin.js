import jwt from "jsonwebtoken";

/*
---- Middleware for validation of super admin token
*/
const authorizeSuperAdmin = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw Error;
    const token = authorization.split(" ")[1];

    const { superAdminUserName } = jwt.verify(
      token,
      process.env.SUPER_ADMIN_JWT_SECRET
    );

    if (!superAdminUserName) throw Error;

    req.body.superAdmin = superAdminUserName;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ error: "TokenExpiredError" });
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authorizeSuperAdmin;
