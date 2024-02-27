import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the student billing information
---- /api/admin/billing/list (GET)
*/
const fetchAllBillingInfo = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const command = new QueryCommand({
      TableName: process.env.STUDENT_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "attribute_exists(transactionID)",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID
      },
      ProjectionExpression:
        "studentUserName, transactionID, paymentID, billingFirstName, billingLastName, usedCouponCode, accountNumber, paidAmount, enrollmentDate"
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0)
      return res.status(200).json({ billingInformation: [] });

    const sortedBillingInformation = result.Items.sort(
      (a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate)
    );

    res.status(200).json({ billingInformation: sortedBillingInformation });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllBillingInfo;
