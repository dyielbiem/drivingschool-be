import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the test of a section
---- /api/admin/section/test (GET)
*/
const fetchSectionTest = async (req, res) => {
  try {
    const { sectionID } = req.query;
    if (!sectionID) throw Error("Section ID must be provided");

    const getSectionCmd = new GetCommand({
      TableName: process.env.SECTION_TABLE,
      Key: {
        sectionID
      }
    });

    const { Item: section } = await dynamoClient.send(getSectionCmd);
    if (!section) throw Error("Section does not exist");

    const queryQuestionsCmd = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID
      }
    });

    const { Items: test } = await dynamoClient.send(queryQuestionsCmd);
    if (test.length === 0)
      return res
        .status(200)
        .json({ noOfQuestionsToShow: section.noOfQuestionsToShow, test: [] });

    test.sort((a, b) => a.questionID.localeCompare(b.questionID));

    test.forEach((question) => {
      const choices = [...question.otherChoices, question.correctAnswer].sort(
        () => Math.random() - 0.5
      );

      Object.assign(question, {
        ...question,
        choices,
        otherChoices: undefined
      });
    });

    res
      .status(200)
      .json({ noOfQuestionsToShow: section.noOfQuestionsToShow, test });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSectionTest;
