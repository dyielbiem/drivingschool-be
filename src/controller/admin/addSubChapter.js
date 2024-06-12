import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add a sub-chapter to a section
---- /api/admin/section/chapter/subchapter (POST)
*/
const addSubChapter = async (req, res) => {
  try {
    const {
      chapterID,
      drivingSchoolID,
      adminUserName,
      subChapterTitle,
      subChapterContent
    } = req.body;

    if (!chapterID || !subChapterTitle)
      throw Error("All required fields must filled");

    const getChapterCommand = new GetCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      }
    });

    const { Item: chapter } = await dynamoClient.send(getChapterCommand);
    if (!chapter) throw Error("Chapter does not exist");

    const querySubChaptersCommand = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      }
    });

    const { Items } = await dynamoClient.send(querySubChaptersCommand);

    const subChapterID = ulid();

    const command = new PutCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      Item: {
        subChapterID,
        chapterID,
        subChapterTitle,
        subChapterContent,
        drivingSchoolID,
        addedBy: adminUserName,
        dateAdded: Date(),
        orderID: Items.length,
        sectionID: chapter.sectionID
      },
      ConditionExpression: "attribute_not_exists(subChapterID)"
    });

    await dynamoClient.send(command);

    res.status(200).json({
      subChapterID,
      subChapterTitle,
      subChapterContent,
      orderID: Items.length
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addSubChapter;
