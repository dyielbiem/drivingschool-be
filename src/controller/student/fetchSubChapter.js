import { getStudent } from "../../utils/dbUtils/student.js";
import { getSubChapter } from "../../utils/dbUtils/subChapter.js";

/*
---- Controller to fetch a sub-chapter
---- /api/student/section/chapter/subchapter/content (GET)
*/
const fetchSubChapter = async (req, res) => {
  try {
    const { subChapterID } = req.query;
    const { drivingSchoolID, studentUserName } = req.body;
    if (!subChapterID) throw Error("Sub-chapter ID must be provided");

    const { Item: student } = await getStudent(
      drivingSchoolID,
      studentUserName
    );
    if (!student) throw Error("Student does not exist");

    const { Item: subChapter } = await getSubChapter(subChapterID);
    if (!subChapter) throw Error("Sub-chapter does not exist");

    res.status(200).json(subChapter);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSubChapter;
