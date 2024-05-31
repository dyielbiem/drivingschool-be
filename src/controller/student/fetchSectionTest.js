import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the test of a section
---- /api/student/section/test (GET)
*/
const fetchSectionTest = async (req, res) => {
  try {
    const { sectionID } = req.body;
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
      },
      ProjectionExpression: "questionID, question, otherChoices, correctAnswer"
    });

    const { Items: test } = await dynamoClient.send(queryQuestionsCmd);
    if (test.length === 0) return res.status(200).json({ test: [] });

    test
      .sort(() => Math.random() - 0.5)
      .forEach((question) => {
        const choices = [...question.otherChoices, question.correctAnswer].sort(
          () => Math.random() - 0.5
        );

        Object.assign(question, {
          ...question,
          choices,
          otherChoices: undefined,
          correctAnswer: undefined
        });
      });

    if (
      !section.noOfQuestionsToShow ||
      section.noOfQuestionsToShow >= test.length
    )
      return res.status(200).json({ test });

    const randomTestQuestions = test.slice(0, section.noOfQuestionsToShow);

    res.status(200).json({ test: randomTestQuestions });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSectionTest;
