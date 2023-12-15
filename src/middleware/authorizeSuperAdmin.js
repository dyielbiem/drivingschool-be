import jwt from "jsonwebtoken";

/*
---- Middleware for validation of super admin token
*/
const authorizeSuperAdmin = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) throw Error;
    const token = authorization.split(" ")[1];

    const { userName } = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);

    req.body.superAdmin = userName;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authorizeSuperAdmin;
