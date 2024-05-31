import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../s3_connection/s3Client.js";

/*
---- Controller to generate pre-signed URL for chapter image upload
---- /api/admin/s3/pre-signed-url/chapter/put (GET)
*/
const generateChapterImageSignedURL = async (req, res) => {
  try {
    const { chapterID } = req.query;
    if (!chapterID) throw Error("Chapter ID must be provided");

    const command = new PutObjectCommand({
      Bucket: process.env.IMAGES_BUCKET,
      Key: `image/chapter/${chapterID}`
    });

    const preSignedURL = await getSignedUrl(s3Client, command, {
      expiresIn: 600
    });

    res.status(200).json({
      preSignedURL,
      imageKey: `chapter/${chapterID}`
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default generateChapterImageSignedURL;
