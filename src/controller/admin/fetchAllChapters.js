import { getSectionChapters } from "../../utils/dbUtils/chapter.js";

/*
---- Controller to fetch all the chapters of a section
---- /api/admin/section/chapter/list (GET)
*/
const fetchAllChapters = async (req, res) => {
  try {
    const { sectionID } = req.query;

    if (!sectionID) throw Error("Section ID must be provided");

    const { Items: chapters = [] } = await getSectionChapters(sectionID, {
      ProjectionExpression:
        "chapterID, chapterTitle, chapterContent, noOfQuestionsToShow, chapterOrder"
    });
    chapters.sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));
    res.status(200).json({ chapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllChapters;
