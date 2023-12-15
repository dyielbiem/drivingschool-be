const authenticateAPIKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (apiKey !== process.env.API_KEY) throw Error;

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authenticateAPIKey;
