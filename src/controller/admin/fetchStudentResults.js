import { getStudentResultPerChapterAndSection } from "../../utils/dbUtils/result.js";

/*
---- Controller to fetch a student test results
---- /api/admin/student/test/result/list (GET)
*/
const fetchStudentResults = async (req, res) => {
  try {
    const { studentUserName } = req.query;
    const { drivingSchoolID } = req.body;

    if (!studentUserName) throw Error("Student username must be provided");

    const latestTestResults = await getStudentResultPerChapterAndSection(
      drivingSchoolID,
      studentUserName
    );

    res.status(200).json({ latestTestResults });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchStudentResults;
