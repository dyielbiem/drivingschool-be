import jwt from "jsonwebtoken";

/*
---- Controller to validate super admin refresh token
---- /api/superadmin/refresh-token/validate (GET)
*/
const validateRefreshToken = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw Error("Refresh token must be provided");

    const refreshToken = authorization.split(" ")[1];

    if (!refreshToken) throw Error("Invalid refresh token");
    const { superAdminUserName } = jwt.verify(
      refreshToken,
      process.env.REFRESH_JWT_SECRET
    );

    if (!superAdminUserName) throw Error("Invalid refresh token");

    res.status(200).json({ message: "Refresh token is valid" });
  } catch (error) {
    if (!error.code) return res.status(401).json({ error: error.message });
    res.status(401).json(error);
  }
};

export default validateRefreshToken;
