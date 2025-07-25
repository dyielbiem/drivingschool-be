import { ulid } from "ulid";

import {
  putAffiliation,
  isAffiliationCodeAvailable
} from "../../utils/dbUtils/affiliation.js";

/*
---- Controller to add affiliation
---- /api/affiliation (POST)
*/
const addAffiliation = async (req, res) => {
  try {
    const { drivingSchoolID, adminUserName, affiliationName, affiliationCode } =
      req.body;

    if (!affiliationName || !affiliationCode)
      throw Error("All required fields must filled");

    const { isAvailable } = await isAffiliationCodeAvailable(
      drivingSchoolID,
      affiliationCode
    );

    if (!isAvailable) throw Error("Affiliation code is already taken");

    const affiliationData = {
      affiliationID: ulid(),
      affiliationName,
      affiliationCode,
      drivingSchoolID,
      addedBy: adminUserName,
      dateAdded: new Date().toISOString()
    };

    await putAffiliation(affiliationData);
    res.status(200).json(affiliationData);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Affiliation ID is already taken" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addAffiliation;
