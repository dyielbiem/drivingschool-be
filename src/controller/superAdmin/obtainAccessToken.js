import jwt from "jsonwebtoken";
import { generateAccessToken } from "../../utils/generateToken.js";

/*
---- Controller to obtain new access token for super admin
---- /api/superadmin/access-token (GET)
*/
const obtainAccessToken = async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) throw Error("Refresh token must be provided");

    const refreshToken = authorization.split(" ")[1];

    if (!refreshToken) throw Error("Invalid refresh token");

    const { superAdminUserName } = jwt.verify(
      refreshToken,
      process.env.REFRESH_JWT_SECRET
    );

    if (!superAdminUserName) throw Error("Invalid refresh token");

    const accessToken = generateAccessToken(
      { superAdminUserName },
      process.env.SUPER_ADMIN_JWT_SECRET
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default obtainAccessToken;
