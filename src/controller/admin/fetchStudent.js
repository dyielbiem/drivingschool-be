import { getStudent } from "../../utils/dbUtils/student.js";
import { getCourse } from "../../utils/dbUtils/course.js";

/*
---- Controller to get the details of a student
---- /api/admin/student (GET)
*/
const fetchStudent = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { studentUserName } = req.query;

    if (!studentUserName) throw Error("Student username is required");

    const { Item: student } = await getStudent(
      drivingSchoolID,
      studentUserName
    );
    if (!student) throw Error("Student does not exist");

    const { Item: course } = await getCourse(student.courseID);

    delete student.passWord;

    return res.status(200).json({
      ...student,
      courseName: course?.courseName || "[This is a deleted course]"
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchStudent;
