import { GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getCoupon = async (couponCode, drivingSchoolID) => {
  const command = new GetCommand({
    TableName: process.env.COUPON_TABLE,
    Key: {
      drivingSchoolID,
      couponCode
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};
