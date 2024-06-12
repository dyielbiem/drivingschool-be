import {
  DeleteCommand,
  QueryCommand,
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import getArrayChunks from "../../utils/getArrayChunks.js";

/*
---- Controller to delete an enrolled student
---- /api/admin/student (DELETE)
*/
const deleteStudent = async (req, res) => {
  try {
    const { studentUserName, drivingSchoolID } = req.body;

    if (!studentUserName) throw Error("Student username must be provided");

    const queryStudentResult = new QueryCommand({
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
      await dynamoClient.send(queryStudentResult);

    // If there is no student test result found,
    // simply delete the student
    if (studentResults.length === 0) {
      const deleteCommand = new DeleteCommand({
        TableName: process.env.STUDENT_TABLE,
        Key: {
          drivingSchoolID,
          studentUserName
        },
        ConditionExpression:
          "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)",
        ReturnValues: "ALL_OLD"
      });

      const deleteResponse = await dynamoClient.send(deleteCommand);

      return res.status(200).json(deleteResponse);
    }

    // If student results are 95 items or less,
    // create a single TransactWriteCommand
    // then delete the student
    if (studentResults.length <= 95) {
      const transactParams = {
        TransactItems: []
      };

      transactParams.TransactItems = studentResults.map((eachResult) => ({
        Delete: {
          TableName: process.env.RESULT_TABLE,
          Key: {
            resultID: eachResult.resultID
          }
        }
      }));

      transactParams.TransactItems.push({
        Delete: {
          TableName: process.env.STUDENT_TABLE,
          Key: {
            drivingSchoolID,
            studentUserName
          }
        }
      });

      const transactCommand = new TransactWriteCommand(transactParams);

      await dynamoClient.send(transactCommand);

      return res
        .status(200)
        .json({ message: "Student has been deleted successfully" });
    }

    // If student results are more 95 items,
    // divide the studentResults array into chunks,
    // and create multiple TransactWriteCommand
    // then delete the student
    const studentResultsChunks = getArrayChunks(studentResults, 95);

    studentResultsChunks.forEach(async (chunk, index) => {
      const transactParams = {
        TransactItems: []
      };

      transactParams.TransactItems = chunk.map((eachResult) => ({
        Delete: {
          TableName: process.env.RESULT_TABLE,
          Key: {
            resultID: eachResult.resultID
          }
        }
      }));

      if (studentResultsChunks.length === index + 1) {
        transactParams.TransactItems.push({
          Delete: {
            TableName: process.env.STUDENT_TABLE,
            Key: {
              drivingSchoolID,
              studentUserName
            }
          }
        });
      }

      const transactCommand = new TransactWriteCommand(transactParams);
      await dynamoClient.send(transactCommand);
    });

    return res
      .status(200)
      .json({ message: "Student has been deleted successfully" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteStudent;
