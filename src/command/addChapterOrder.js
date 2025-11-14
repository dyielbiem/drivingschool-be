import { getAllSection } from "../utils/dbUtils/section.js";
import {
  getSectionChapters,
  updateChapterOrder
} from "../utils/dbUtils/chapter.js";

const getChapterSets = async (sections) => {
  const promises = [];
  sections.forEach((item) => {
    promises.push(
      getSectionChapters(item.sectionID, {
        ProjectionExpression: "sectionID, chapterID, chapterTitle, chapterOrder"
      })
    );
  });

  return Promise.all(promises);
};

const createTransactUpdate = async (chapterSets) => {
  const updatePromises = [];
  chapterSets.forEach((obj) => {
    const set = obj.Items || [];
    if (set.length === 0 || set.some((item) => item.chapterOrder)) return;

    set.sort((a, b) => a.chapterID.localeCompare(b.chapterID));
    updatePromises.push(updateChapterOrder(set));
  });

  return Promise.all(updatePromises);
};

/* eslint-disable no-console */
export const handler = async () => {
  try {
    const { Items: sections } = await getAllSection({
      ProjectionExpression: "sectionID"
    });

    const chapterSets = await getChapterSets(sections);
    await createTransactUpdate(chapterSets);

    const updatedChapterSets = await getChapterSets(sections);
    updatedChapterSets.forEach((set) => console.log(set.Items));
  } catch (error) {
    console.error(error);
  }
};
