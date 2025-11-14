import passwordGenerator from "generate-password";
import { hashPassWord } from "../../utils/index.js";
import { encrypt } from "../../utils/crypto.js";
import { updateStudentItem } from "../../utils/dbUtils/student.js";

/*
---- Controller to update the password of a student
---- /api/admin/student/password (PATCH)
*/
const updateStudentPassword = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName } = req.body;

    if (!studentUserName) throw Error("Student username is required");

    const passWord = passwordGenerator.generate({
      length: 16,
      numbers: true,
      symbols: true
    });

    const hashedPassWord = await hashPassWord(passWord);
    const encryptedPassWord = encrypt(passWord);

    await updateStudentItem(drivingSchoolID, studentUserName, {
      ":passWord": hashedPassWord,
      ":encryptedPassWord": encryptedPassWord
    });

    return res.status(200).json({
      newPassWord: passWord
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateStudentPassword;
