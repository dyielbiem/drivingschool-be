import dayjs from "dayjs";
import { parseDate } from "chrono-node";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update a discount coupon of a driving school
---- /api/admin/coupon (PATCH)
*/
const updateCoupon = async (req, res) => {
  try {
    const { drivingSchoolID, couponCode } = req.body;
    if (!couponCode) throw Error("couponCode is required");

    const editableFields = [
      { key: "couponAmount", type: "number" },
      { key: "fromDate", type: "date" },
      { key: "toDate", type: "date" },
      { key: "isActive", type: "boolean" }
    ];

    const { expression, expressionValues } = editableFields.reduce(
      (acc, field) => {
        const { key, type } = field;
        if (!(key in req.body)) return acc;
        if (
          type === "date"
            ? !parseDate(req.body[key])
            : typeof req.body[key] !== type
        )
          throw Error(`${key} must be a ${type}`);

        acc.expression.push(`${key} = :${key}`);
        acc.expressionValues[`:${key}`] =
          type !== "date"
            ? req.body[key]
            : dayjs(parseDate(req.body[key])).format("MM-DD-YYYY");
        return acc;
      },
      { expression: [], expressionValues: {} }
    );

    if ("fromDate" in req.body && !("toDate" in req.body))
      throw Error("toDate is required");
    if ("toDate" in req.body && !("fromDate" in req.body))
      throw Error("fromDate is required");
    if ("fromDate" in req.body && "toDate" in req.body) {
      const parsedFromDate = dayjs(parseDate(req.body.fromDate));
      const parsedToDate = dayjs(parseDate(req.body.toDate));

      if (parsedToDate.isBefore(parsedFromDate))
        throw Error("toDate must be same or later than fromDate");
    }

    const command = new UpdateCommand({
      TableName: process.env.COUPON_TABLE,
      Key: {
        couponCode,
        drivingSchoolID
      },
      UpdateExpression: `SET ${expression.join(", ")}`,
      ExpressionAttributeValues: expressionValues,
      ConditionExpression:
        "attribute_exists(couponCode) AND attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedCoupon } = await dynamoClient.send(command);

    return res.status(200).json(updatedCoupon);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Coupon code does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateCoupon;
