import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ulid } from "ulid";
import s3Client from "../../s3_connection/s3Client.js";

/*
---- Controller to allow admin to upload image
---- /api/admin/s3/pre-signed-url/put (GET)
*/
const generatePutPreSignedURL = async (req, res) => {
  try {
    const key = ulid();

    const command = new PutObjectCommand({
      Bucket: process.env.IMAGES_BUCKET,
      Key: `image/${key}`
    });

    const signedURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    res.status(200).json({ signedURL, imageKey: key });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default generatePutPreSignedURL;
