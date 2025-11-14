import { decrypt } from "../../utils/crypto.js";
import { getStudent } from "../../utils/dbUtils/student.js";

/*
---- Controller to get the password of a student
---- /api/admin/student/password (GET)
*/
const fetchStudentPassword = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { studentUserName } = req.query;

    if (!studentUserName) throw Error("Student username is required");

    const { Item: student = {} } = await getStudent(
      drivingSchoolID,
      studentUserName
    );
    if (!student) throw Error("Student does not exist");

    const { encryptedPassWord } = student;
    return res.status(200).json({
      passWord: encryptedPassWord ? decrypt(encryptedPassWord) : ""
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchStudentPassword;
