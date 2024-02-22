import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the title of a section
---- /api/admin/section/title (PATCH)
*/
const updateSectionTitle = async (req, res) => {
  try {
    const { sectionID, sectionTitle } = req.body;
    if (!sectionID || !sectionTitle)
      throw Error("All required fields must be provided");

    const command = new UpdateCommand({
      TableName: process.env.SECTION_TABLE,
      Key: {
        sectionID
      },
      UpdateExpression: "SET sectionTitle = :sectionTitleValue",
      ExpressionAttributeValues: {
        ":sectionTitleValue": sectionTitle
      },
      ConditionExpression: "attribute_exists(sectionID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedStudent } = await dynamoClient.send(command);

    return res.status(200).json(updatedStudent);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Section does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateSectionTitle;
