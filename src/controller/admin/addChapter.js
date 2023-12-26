import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import { ulid } from "ulid";

/*
---- Controller to add a chapter to a section
---- /api/admin/section/chapter (POST)
*/

const addChapter = async (req, res) => {
  try {
    const {
      sectionID,
      drivingSchoolID,
      adminUserName,
      chapterTitle,
      chapterContent,
    } = req.body;

    if (!sectionID || !chapterTitle || !chapterContent)
      throw Error("All required fields must filled");

    const chapterID = ulid();

    const command = new PutCommand({
      TableName: process.env.CHAPTER_TABLE,
      Item: {
        chapterID,
        sectionID,
        chapterTitle,
        chapterContent,
        drivingSchoolID,
        addedBy: adminUserName,
        dateAdded: Date(),
      },
    });

    await dynamoClient.send(command);

    res.status(200).json({ chapterID, chapterTitle, chapterContent });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addChapter;
