import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // These credentials MUST be set in your Vercel project environment variables
  const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
  } = process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    return res.status(500).json({ error: 'Cloudflare R2 environment variables not set.' });
  }

  const S3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Vercel automatically parses the body if content-type is application/json
    const { fileName, contentType } = req.body || {};

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'Missing fileName or contentType' });
    }

    // Sanitize file name
    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: safeFileName,
      ContentType: contentType,
    });

    // Generate a pre-signed URL for the client to upload the file to
    const uploadUrl = await getSignedUrl(S3, command, { expiresIn: 60 }); // URL expires in 60 seconds
    
    // The final public URL after the upload is complete
    const publicUrl = `${R2_PUBLIC_URL}/${safeFileName}`;

    return res.status(200).json({ uploadUrl, publicUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return res.status(500).json({ error: `Error: ${error.message}` });
  }
}