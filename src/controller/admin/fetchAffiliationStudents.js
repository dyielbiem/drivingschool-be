import { parseDate } from "chrono-node";

import { getAffiliationStudentList } from "../../utils/dbUtils/student.js";

/*
---- Controller to fetch all the students of a affiliation
---- /api/admin/affiliation/student/ist (GET)
*/
const fetchAffiliationStudents = async (req, res) => {
  try {
    const { affiliationID } = req.query;
    if (!affiliationID) throw Error("Affiliation ID is required");

    const studentList = await getAffiliationStudentList(affiliationID);

    res
      .status(200)
      .json(
        studentList.sort(
          (a, b) => parseDate(b.enrollmentDate) - parseDate(a.enrollmentDate)
        )
      );
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAffiliationStudents;
