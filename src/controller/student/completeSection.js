import {
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";

/*
---- Controller to complete course of a student
---- /api/student/section/completion (GET)
*/
const completeSection = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName, sectionID } = req.body;

    const studentCommand = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      }
    });

    const { Item: student } = await dynamoClient.send(studentCommand);
    if (!student) throw Error("Student does not exist");

    if (student.isCourseCompleted)
      throw Error("Student already completed the course");

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

    const sortedResults = latestTestResults.sort((a, b) => {
      if (a.sectionID) return 1;
      if (b.sectionID) return -1;
      return a.chapterID.localeCompare(b.chapterID);
    });

    await dynamoClient.send(completeSectionCommand);

    // Get the email of the driving school
    const getDrivingSchoolCmd = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      }
    });

    const { Item: drivingSchool } =
      await dynamoClient.send(getDrivingSchoolCmd);
    if (!drivingSchool) throw Error("Driving school does not exist");

    const studentName = `${student.mailingFirstName} ${student.mailingLastName}`;

    // Layout the email main message for student and driving school
    const studentEmailMessage = `<p>Dear ${studentName},</p><p>Congratulations you have completed the final test and have passed the course.</p><p style="margin: 0;">You will receive your completion certificate between 5-7 Business Days.</p><p style="margin: 0;">We cannot email or fax it. If you would like to pick it up, please call us with 24 hours so that we may hold it for pick up.</p><p style="margin: 0; margin-top: 24px;">Test Results are as follows:</p>`;

    const drivingSchoolEmailMessage = `<p>Dear Admin,</p><p>${studentName} has completed the online driver's ed course</p><p style="margin: 0; margin-top: 24px;">Test Results are as follows:</p>`;

    // Layout the test scores
    let scoreRows = "";
    sortedResults.forEach((result, index) => {
      const dateAnswered = new Date(result.dateAnswered);
      const month = String(dateAnswered.getMonth() + 1).padStart(2, "0");
      const day = String(dateAnswered.getDate()).padStart(2, "0");
      const year = String(dateAnswered.getFullYear());
      const dateCompleted = `${month}-${day}-${year}`;
      const row = `<tr><td>${String(index + 1).padStart(2, "0")}</td>
      <td>${dateCompleted}</td>
      <td>${result.scorePercentage}</td></tr>`;

      scoreRows += row;
    });

    const scoreTable = `<table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;"><colgroup><col style="width: 30%;"><col style="width: 40%%;"><col style="width: 30%;"></colgroup><tr><th style="text-align: left;">Chapter</th><th style="text-align: left;">Date Completed</th><th style="text-align: left;">Score</th><tr>${scoreRows}</table><p style="margin-top: 16px;">Thank you!</p>`;

    // Email the test scores to the student and driving school
    const emailStudentArgs = {
      invokePath: "/api/student/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: student.mailingEmail,
        emailSubject: "Student Completion Result",
        emailBody: studentEmailMessage + scoreTable
      }
    };

    const emailDrivingSchoolArgs = {
      invokePath: "/api/student/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: drivingSchool.email,
        emailSubject: "Student Completion Result",
        emailBody: drivingSchoolEmailMessage + scoreTable
      }
    };

    await invokeFunction(emailDrivingSchoolArgs);
    await invokeFunction(emailStudentArgs);

    res.status(200).json({
      isCourseCompleted: true,
      message: "Congratulations, you've successfully completed the course"
    });
  } catch (error) {
    res.status(400).json({ error: error.message ? error.message : error });
  }
};

export default completeSection;
