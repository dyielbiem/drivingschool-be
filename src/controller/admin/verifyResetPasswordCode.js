import { encrypt, decrypt } from "../../utils/crypto.js";

/*
---- Controller to verify code when reset password
---- /api/admin/reset-password/code (POST)
*/
const verifyResetPasswordCode = async (req, res) => {
  try {
    const { verificationToken, verificationCode } = req.body;

    if (!verificationToken || !verificationCode)
      throw Error("All required fields must be provided");

    let verificationPayload;
    try {
      const payloadString = decrypt(verificationToken);
      verificationPayload = JSON.parse(payloadString);
    } catch {
      throw Error("Invalid verification token");
    }

    const {
      adminUserName,
      verificationCode: emailedVerificationCode,
      verifyExpiration
    } = verificationPayload;

    if (!verifyExpiration || !adminUserName)
      throw Error("Invalid verification token");

    if (emailedVerificationCode !== verificationCode)
      throw Error("Incorrect verification code");

    if (new Date(verifyExpiration) < new Date())
      throw Error("Verification code has expired");

    const resetExpiration = new Date();
    resetExpiration.setMinutes(resetExpiration.getMinutes() + 10);

    const resetPassPayload = {
      adminUserName,
      resetExpiration: resetExpiration
    };

    const resetPasswordToken = encrypt(JSON.stringify(resetPassPayload));

    res.status(200).json({ resetPasswordToken });
  } catch (error) {
    res.status(400).json(!error.code ? { error: error.message } : error);
  }
};

export default verifyResetPasswordCode;
