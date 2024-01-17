import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the coupons of a driving school
---- /api/admin/coupon/list (GET)
*/
const fetchAllCoupons = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const command = new QueryCommand({
      TableName: process.env.COUPON_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID
      }
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0) return res.status(200).json({ coupons: [] });

    const sortedCoupons = result.Items.sort(
      (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
    );

    res.status(200).json({ coupons: sortedCoupons });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllCoupons;
