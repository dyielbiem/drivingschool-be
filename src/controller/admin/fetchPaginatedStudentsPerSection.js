import { getAllStudentsInSection } from "../../utils/dbUtils/student.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { paginate } from "../../utils/index.js";

/*
---- Controller to fetch paginated students of a section
---- /api/admin/section/student/list (GET)
*/
const fetchPaginatedStudentsPerSection = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { sectionID, page = 1, sortBy, search } = req.query;

    if (!sectionID) throw Error("Section ID must be provided");

    const [students, { Item: drivingSchool = {} }] = await Promise.all([
      getAllStudentsInSection(drivingSchoolID, sectionID),
      getDrivingSchool(drivingSchoolID, { ProjectionExpression: "noOfRows" })
    ]);

    if (students.length === 0) return res.status(200).json({ allStudents: [] });

    let sortedStudent = students
      .filter((item) => item.paymentMethod !== "stripe" || item.isPaid)
      .map(({ passWord, encryptedPassWord, ...item }) => item);

    switch (sortBy) {
      case "latestRegistrations":
        sortedStudent.sort(
          (a, b) =>
            new Date(b.enrollmentDate).getTime() -
            new Date(a.enrollmentDate).getTime()
        );
        break;

      case "latestCompletions":
        sortedStudent.sort((a, b) => {
          const aDate = a.completionDate?.trim();
          const bDate = b.completionDate?.trim();

          if (!aDate && !bDate) return 0;
          if (aDate && !bDate) return -1;
          if (!aDate && bDate) return 1;

          return Date.parse(bDate) - Date.parse(aDate);
        });
        break;

      default:
        sortedStudent.sort((a, b) =>
          a.studentUserName.localeCompare(b.studentUserName)
        );
    }

    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      sortedStudent = sortedStudent.filter((student) => {
        const {
          studentUserName = "",
          mailingEmail = "",
          mailingFirstName = "",
          mailingLastName = ""
        } = student;

        return [
          studentUserName || "",
          mailingEmail || "",
          `${mailingFirstName || ""} ${mailingLastName || ""}`
        ].some((value) => value?.toLowerCase?.().includes(lowerCaseSearch));
      });
    }

    const {
      data: studentList,
      totalCount,
      totalPages,
      hasNext
    } = paginate(sortedStudent, page, drivingSchool.noOfRows || 10);

    res.status(200).json({
      totalCount,
      totalPages,
      hasNext,
      studentList
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchPaginatedStudentsPerSection;
