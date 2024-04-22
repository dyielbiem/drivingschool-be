import {
  QueryCommand,
  UpdateCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to generate the section test result
---- /api/student/section/test/result (POST)
*/

const completeSection = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName, sectionID } = req.body;

    const studentResultCommand = new QueryCommand({
      TableName: process.env.RESULT_TABLE,
      IndexName: "StudentIndex",
      KeyConditionExpression:
        "studentUserName = :studentUserName AND drivingSchoolID = :drivingSchoolID",
      ExpressionAttributeValues: {
        ":studentUserName": studentUserName,
        ":drivingSchoolID": drivingSchoolID
      }
    });

    const { Items: studentResults } =
      await dynamoClient.send(studentResultCommand);

    if (studentResults.length === 0)
      throw Error("You have not completed the course yet");

    // Retrieve all the recent score of each test
    const latestTestResults = studentResults
      .sort((a, b) => b.resultID.localeCompare(a.resultID))
      .reduce((acc, currentTest) => {
        const isTestExist = acc.find(
          (test) =>
            (currentTest.chapterID &&
              currentTest.chapterID === test.chapterID) ||
            (currentTest.sectionID && currentTest.sectionID === test.sectionID)
        );

        return isTestExist ? acc : [...acc, currentTest];
      }, []);

    // Check if section test is taken
    const isSectionTestTaken = latestTestResults.find((test) => test.sectionID);
    if (!isSectionTestTaken) throw Error("Section test must be taken");

    // Check if every test has a passing score
    const areAllTestsPassed = latestTestResults.every((test) => test.isPassed);
    if (!areAllTestsPassed) throw Error("Each test must have a passing grade");

    // Retrieve the list of chapters that have test
    const queryChaptersCommand = new QueryCommand({
      TableName: process.env.CHAPTER_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionID",
      ExpressionAttributeValues: {
        ":sectionID": sectionID
      }
    });

    const { Items: chapters } = await dynamoClient.send(queryChaptersCommand);
    if (chapters.length === 0) throw Error("Section does not have any chapter");

    const chapterQuestionsCommand = new ScanCommand({
      TableName: process.env.QUESTION_TABLE,
      FilterExpression: "drivingSchoolID = :drivingSchoolID",
      ExpressionAttributeValues: {
        ":drivingSchoolID": drivingSchoolID
      }
    });

    const { Items: chapterTestQuestions } = await dynamoClient.send(
      chapterQuestionsCommand
    );

    if (chapterTestQuestions.length === 0)
      throw Error("There is no any chapter test");

    const chapterTests = chapters.map((chapter) => {
      const chapterHasTest = chapterTestQuestions.find(
        (question) => question.chapterID === chapter.chapterID
      );

      if (!chapterHasTest) return;
      return chapter;
    });

    // Check if the number of test scores are equal to number of tests
    if (latestTestResults.length !== chapterTests.length + 1) {
      chapterTests.forEach((test) => {
        const isTestTaken = latestTestResults.find(
          (result) => result.chapterID === test.chapterID
        );
        if (!isTestTaken)
          throw Error(
            `You must pass the chapter test of '${test.chapterTitle}'`
          );
      });
    }

    const completeSectionCommand = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: "SET isCourseCompleted = :isCourseCompleted",
      ExpressionAttributeValues: {
        ":isCourseCompleted": true
      },
      ConditionExpression:
        "attribute_exists(studentUserName) AND attribute_exists(drivingSchoolID)"
    });

    await dynamoClient.send(completeSectionCommand);

    res.status(200).json({
      isCourseCompleted: true,
      message: "Congratulations, you've successfully completed the course"
    });
  } catch (error) {
    res.status(400).json({ error: error.message ? error.message : error });
  }
};

export default completeSection;
