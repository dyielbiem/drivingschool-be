import jwt from "jsonwebtoken";

/*
---- Middleware for validation of super admin token
*/
const superAdminMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) throw Error;
    const token = authorization.split(" ")[1];

    const { username } = jwt.verify(token, process.env.JWT_SECRET);

    console.log(username);
    req.body.superAdmin = username;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default superAdminMiddleware;
