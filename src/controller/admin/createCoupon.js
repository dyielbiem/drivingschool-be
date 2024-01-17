import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to create a discount coupon of a driving school
---- /api/admin/coupon (POST)
*/
const createCoupon = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      adminUserName,
      couponCode,
      couponAmount,
      fromDate,
      toDate
    } = req.body;

    const fromDateFormatted = new Date(fromDate);
    const toDateFormatted = new Date(toDate);

    if (!couponCode || !couponAmount || !fromDate || !toDate)
      throw Error("All required fields must be filled");

    if (typeof couponAmount !== "number")
      throw Error("couponAmount must be a number");

    if (
      String(fromDateFormatted) === "Invalid Date" ||
      String(toDateFormatted) === "Invalid Date"
    )
      throw Error("fromDate and toDate must be a valid date format");

    if (fromDateFormatted > toDateFormatted)
      throw Error("Invalid coupon date validity");

    const command = new PutCommand({
      TableName: process.env.COUPON_TABLE,
      Item: {
        couponCode,
        drivingSchoolID,
        couponAmount,
        fromDate,
        toDate,
        isActive: true,
        dateAdded: Date(),
        addedBy: adminUserName
      },
      ConditionExpression:
        "attribute_not_exists(couponCode) AND attribute_not_exists(drivingSchoolID)"
    });

    await dynamoClient.send(command);

    return res.status(200).json({
      couponCode,
      drivingSchoolID,
      couponAmount,
      fromDate,
      toDate,
      isActive: true,
      dateAdded: Date(),
      addedBy: adminUserName
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "The coupon code already exists" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default createCoupon;
