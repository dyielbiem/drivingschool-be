import { getAffiliationByID } from "../../utils/dbUtils/affiliation.js";

/*
---- Controller to fetch affiliation by ID
---- /api/admin/affiliation (GET)
*/
const fetchAffiliation = async (req, res) => {
  try {
    const { affiliationID } = req.query;
    if (!affiliationID) throw Error("Affiliation ID is required");

    const affiliation = await getAffiliationByID(affiliationID);
    if (!affiliation) throw Error("Affiliation does not exist");

    res.status(200).json(affiliation);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAffiliation;
