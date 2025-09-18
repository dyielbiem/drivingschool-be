import { getAllStudentsInSection } from "../../utils/dbUtils/student.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { paginate } from "../../utils/index.js";

/*
---- Controller to fetch all the students of a section
---- /api/admin/student/all (GET)
*/
const fetchAllStudentsPerSection = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { sectionID, page = 1, pageSize = 50 } = req.query;

    if (!sectionID) throw Error("Section ID must be provided");

    const [students, { Item: drivingSchool = {} }] = await Promise.all([
      getAllStudentsInSection(drivingSchoolID, sectionID),
      getDrivingSchool(drivingSchoolID, { ProjectionExpression: "noOfRows" })
    ]);

    if (students.length === 0) return res.status(200).json({ allStudents: [] });

    const sortedStudent = students.sort(
      (a, b) => new Date(a.enrollmentDate) - new Date(b.enrollmentDate)
    );

    const {
      data: allStudents,
      totalCount,
      totalPages,
      hasNext
    } = paginate(sortedStudent, page, pageSize);

    res.status(200).json({
      totalCount,
      totalPages,
      hasNext,
      allStudents,
      noOfRows: drivingSchool.noOfRows || 0
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllStudentsPerSection;
