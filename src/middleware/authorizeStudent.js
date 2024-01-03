import jwt from "jsonwebtoken";

/*
---- Middleware for validation of student token
*/
const authorizeStudent = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) throw Error;
    const token = authorization.split(" ")[1];

    const { studentUserName, drivingSchoolID } = jwt.verify(
      token,
      process.env.STUDENT_JWT_SECRET
    );

    req.body.studentUserName = studentUserName;
    req.body.drivingSchoolID = drivingSchoolID;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authorizeStudent;
