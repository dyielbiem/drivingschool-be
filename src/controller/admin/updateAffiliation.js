import {
  isAffiliationCodeAvailable,
  updateAffiliationItem
} from "../../utils/dbUtils/affiliation.js";
import { getAffiliationStudentList } from "../../utils/dbUtils/student.js";

/*
---- Controller to update affiliation
---- /api/admin/affiliation (PATCH)
*/
const updateAffiliation = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      affiliationID,
      affiliationName,
      affiliationInfo = "",
      affiliationCode
    } = req.body;

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
      ":affiliationInfo": affiliationInfo,
      ":affiliationCode": affiliationCode
    });
    const studentList = await getAffiliationStudentList(
      updatedAffiliation.affiliationID
    );

    res
      .status(200)
      .json({ ...updatedAffiliation, studentCount: studentList.length });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Affiliation does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateAffiliation;
