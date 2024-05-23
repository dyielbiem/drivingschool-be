import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the number of section question 
---- that needed to be answered by the students
---- /api/admin/section/question/shown-count
*/
const updateShownSectionQCount = async (req, res) => {
  try {
    const { sectionID, noOfQuestionsToShow } = req.body;
    if (!sectionID) throw Error("Section ID must be provided");

    if (
      noOfQuestionsToShow &&
      (!Number.isInteger(noOfQuestionsToShow) || noOfQuestionsToShow < 1)
    )
      throw Error("Number of questions to show must be a positive integer");

    const queryQuestionsCmd = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionID",
      ExpressionAttributeValues: {
        ":sectionID": sectionID
      }
    });

    const { Items: questions } = await dynamoClient.send(queryQuestionsCmd);
    if (questions.length === 0)
      throw Error("Section does not have any test question");

    if (questions.length < noOfQuestionsToShow)
      throw Error(
        "Number of questions to show is more than the number of section questions"
      );

    const updateSectionCmd = new UpdateCommand({
      TableName: process.env.SECTION_TABLE,
      Key: {
        sectionID
      },
      UpdateExpression: "SET noOfQuestionsToShow = :noOfQuestionsToShow",
      ExpressionAttributeValues: {
        ":noOfQuestionsToShow": noOfQuestionsToShow || null
      },
      ConditionExpression: "attribute_exists(sectionID)"
    });

    await dynamoClient.send(updateSectionCmd);

    return res
      .status(200)
      .json({ message: "Number of questions to show has been updated" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Section does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateShownSectionQCount;
