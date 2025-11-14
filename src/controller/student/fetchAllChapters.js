import { getStudent } from "../../utils/dbUtils/student.js";
import { getSectionChapters } from "../../utils/dbUtils/chapter.js";
import { getStudentResults } from "../../utils/dbUtils/result.js";

/*
---- Controller to fetch the chapters of a section
---- /api/student/section/chapter/list (GET)
*/
const fetchAllChapters = async (req, res) => {
  try {
    const { sectionID } = req.query;
    const { drivingSchoolID, studentUserName } = req.body;
    if (!sectionID) throw Error("Section ID must be provided");

    const { Item: student } = await getStudent(
      drivingSchoolID,
      studentUserName
    );
    if (!student) throw Error("Student does not exist");

    const [{ Items: sectionChapters = [] }, { Items: studentResults = [] }] =
      await Promise.all([
        getSectionChapters(sectionID, {
          ProjectionExpression:
            "chapterID, chapterTitle, chapterContent, noOfQuestionsToShow, chapterOrder"
        }),
        getStudentResults(drivingSchoolID, studentUserName, {
          FilterExpression: "attribute_exists(chapterID)"
        })
      ]);

    if (sectionChapters.length === 0)
      return res.status(200).json({ chapters: [] });

    sectionChapters.sort(
      (a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0)
    );
    studentResults.sort((a, b) => b.resultID.localeCompare(a.resultID));

    const { completedChapters = [] } = student;
    const updatedChapters = sectionChapters.map(({ chapterID, ...attrs }) => {
      const isCompleted = completedChapters.some(
        (c) => c.chapterID === chapterID
      );
      const testResult =
        studentResults.find((r) => r.chapterID === chapterID && r.isPassed) ||
        studentResults.find((r) => r.chapterID === chapterID) ||
        null;

      return {
        chapterID,
        ...attrs,
        isCompleted,
        testResult
      };
    });

    res.status(200).json({ chapters: updatedChapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllChapters;
