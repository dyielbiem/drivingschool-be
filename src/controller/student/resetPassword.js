import { hashPassWord } from "../../utils/index.js";
import { encrypt, decrypt } from "../../utils/crypto.js";
import { updateStudentItem } from "../../utils/dbUtils/student.js";

/*
---- Controller to reset password
---- /api/student/reset-password (PATCH)
*/
const resetPassword = async (req, res) => {
  try {
    const { resetPasswordToken, passWord, confirmPassWord } = req.body;

    if (!resetPasswordToken || !passWord || !confirmPassWord)
      throw Error("All required field must be provided");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    let payload;
    try {
      const payloadString = decrypt(resetPasswordToken);
      payload = JSON.parse(payloadString);
    } catch {
      throw Error("Invalid reset password token");
    }

    const { drivingSchoolID, studentUserName, resetExpiration } = payload;

    if (!resetExpiration || !drivingSchoolID || !studentUserName)
      throw Error("Invalid reset password token");

    if (new Date() > new Date(resetExpiration))
      throw Error("Reset password token has expired");

    const hashedPassWord = await hashPassWord(passWord);
    const encryptedPassWord = encrypt(passWord);

    await updateStudentItem(drivingSchoolID, studentUserName, {
      ":passWord": hashedPassWord,
      ":encryptedPassWord": encryptedPassWord
    });

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default resetPassword;
