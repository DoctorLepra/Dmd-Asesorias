// IMPORTANT: This file requires external dependencies.
// You need to create a `package.json` in your `netlify/functions` directory
// and run `npm install` for `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

// Example `netlify/functions/package.json`:
// {
//   "dependencies": {
//     "@aws-sdk/client-s3": "^3.525.0",
//     "@aws-sdk/s3-request-presigner": "^3.525.0",
//     "@netlify/functions": "^2.0.0"
//   }
// }

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // These credentials MUST be set in your Netlify site's environment variables
  const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
  } = process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    return { statusCode: 500, body: 'Cloudflare R2 environment variables not set.' };
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
    const { fileName, contentType } = JSON.parse(event.body || '{}');

    if (!fileName || !contentType) {
      return { statusCode: 400, body: 'Missing fileName or contentType' };
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

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl, publicUrl }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};

export { handler };