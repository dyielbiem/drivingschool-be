import { getStudent } from "../../utils/dbUtils/student.js";
import { getStudentResults } from "../../utils/dbUtils/result.js";
import { getSectionChapters } from "../../utils/dbUtils/chapter.js";
import { getSectionSubChapters } from "../../utils/dbUtils/subChapter.js";
import { getDrivingSchoolQuestions } from "../../utils/dbUtils/question.js";

/*
---- Controller to fetch a student test results
---- /api/admin/student/completion/list (GET)
*/
const fetchStudentCompletions = async (req, res) => {
  try {
    const { studentUserName } = req.query;
    const { drivingSchoolID } = req.body;

    if (!studentUserName) throw Error("Student username must be provided");

    const { Item: student } = await getStudent(
      drivingSchoolID,
      studentUserName
    );
    if (!student) throw Error("Student does not exist");
    const {
      sectionID,
      completedChapters = [],
      viewedSubChapters = []
    } = student;

    const [
      { Items: sectionChapters = [] },
      { Items: studentResults = [] },
      { Items: chapterQuestions = [] }
    ] = await Promise.all([
      getSectionChapters(sectionID),
      getStudentResults(drivingSchoolID, studentUserName),
      getDrivingSchoolQuestions(drivingSchoolID, {
        FilterExpression: "attribute_exists(chapterID)"
      })
    ]);

    if (sectionChapters.length === 0)
      throw Error("Section does not have any chapter");

    sectionChapters.sort((a, b) => a.chapterID.localeCompare(b.chapterID));
    studentResults.sort((a, b) => {
      if (a.sectionID && !b.sectionID) return 1;
      if (b.sectionID && !a.sectionID) return -1;
      return b.resultID.localeCompare(a.resultID);
    });

    const sectionTestResult = studentResults.find((item) => item.sectionID);
    const completions = sectionChapters.map((chapter) => {
      const { chapterID, chapterTitle } = chapter;
      const isChapterCompleted = completedChapters.find(
        (c) => c.chapterID === chapterID
      );
      const chapterHasTest = chapterQuestions.find(
        (q) => q.chapterID === chapterID
      );

      const chapterTestResult =
        studentResults.find((r) => r.chapterID === chapterID && r.isPassed) ||
        studentResults.find((r) => r.chapterID === chapterID) ||
        null;

      const {
        resultID,
        score = null,
        numberOfQuestions = null,
        isPassed = false,
        dateAnswered = null
      } = chapterTestResult || {};

      const progressStatus = isChapterCompleted
        ? "Completed"
        : chapterHasTest && chapterTestResult && !isPassed
          ? "Exam not passed"
          : "Not completed";

      const dateCompleted =
        dateAnswered || isChapterCompleted?.dateCompleted || null;

      return {
        chapterID,
        chapterTitle,
        resultID,
        progressStatus,
        score,
        numberOfQuestions,
        dateCompleted
      };
    });

    const {
      score = null,
      numberOfQuestions = null,
      isPassed = false,
      dateAnswered = null
    } = sectionTestResult || {};
    completions.push({
      sectionID: sectionID,
      sectionTitle: "Final Test",
      progressStatus: !sectionTestResult
        ? "Not completed"
        : isPassed
          ? "Completed"
          : "Exam not passed",
      score,
      numberOfQuestions,
      dateCompleted: dateAnswered
    });

    const { Items: subChapters = [] } = await getSectionSubChapters(sectionID);
    res.status(200).json({
      completions,
      viewedSubChaptersCount: viewedSubChapters.length || 0,
      totalSubChaptersCount: subChapters.length || 0
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchStudentCompletions;
