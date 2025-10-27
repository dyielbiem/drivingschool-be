import {
  getSectionChapters,
  updateChapterOrder
} from "../../utils/dbUtils/chapter.js";

/*
---- Controller to update chapter order of a section
---- /api/admin/section/chapter/list/order (PATCH)
*/
const updateChaptersOrder = async (req, res) => {
  try {
    const { chapters, sectionID } = req.body;

    if (!sectionID) throw Error("Section ID must be provided");
    if (!chapters) throw Error("Chapters must be provided");
    if (!Array.isArray(chapters)) throw Error("Chapters must be an array");
    if (chapters.length === 0) throw Error("Chapters must not be empty");

    const { Items: oldChapters } = await getSectionChapters(sectionID);

    if (oldChapters.length !== chapters.length)
      throw Error("Chapter count does not match");

    await updateChapterOrder(chapters);

    res.status(200).json({ message: "Chapter order has been updated" });
  } catch (error) {
    if (error.message && error.message.includes("Transaction cancelled"))
      return res.status(400).json({ error: "Unable to update chapter order" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateChaptersOrder;
