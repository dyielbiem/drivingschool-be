import { deleteAffiliationItem } from "../../utils/dbUtils/affiliation.js";

/*
---- Controller to delete affiliation
---- /api/admin/affiliation (DELETE)
*/
const deleteAffiliation = async (req, res) => {
  try {
    const { affiliationID } = req.body;

    if (!affiliationID) throw Error("Affiliation ID is required");

    await deleteAffiliationItem(affiliationID);
    res.status(200).json({ message: "Affiliation has been deleted" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Affiliation does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteAffiliation;
