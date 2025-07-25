import {
  isAffiliationCodeAvailable,
  updateAffiliationItem
} from "../../utils/dbUtils/affiliation.js";

/*
---- Controller to update affiliation
---- /api/admin/affiliation (PATCH)
*/
const updateAffiliation = async (req, res) => {
  try {
    const { drivingSchoolID, affiliationID, affiliationName, affiliationCode } =
      req.body;

    if (!affiliationID || !affiliationName || !affiliationCode)
      throw Error("All required fields must filled");

    const { existingAffiliation } = await isAffiliationCodeAvailable(
      drivingSchoolID,
      affiliationCode
    );

    if (
      existingAffiliation &&
      existingAffiliation.affiliationID !== affiliationID
    )
      throw Error("Affiliation code is already taken");

    const updatedAffiliation = await updateAffiliationItem(affiliationID, {
      ":affiliationName": affiliationName,
      ":affiliationCode": affiliationCode
    });

    res.status(200).json(updatedAffiliation);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Affiliation does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateAffiliation;
