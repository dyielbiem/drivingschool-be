import jwt from "jsonwebtoken";

/*
---- Utility function to generate access token
*/
export const generateAccessToken = (payload, secret) => {
  const token = jwt.sign(payload, secret, {
    expiresIn: "3h"
  });
  return token;
};

/*
---- Utility function to generate refresh token
*/
export const generateRefreshToken = (payload) => {
  const token = jwt.sign(payload, process.env.REFRESH_JWT_SECRET);
  return token;
};
