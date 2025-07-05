import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Uploads an image buffer to Cloudinary.
 * @param imageBuffer The image file as a buffer.
 * @param filename Optional filename for the image (used as public_id).
 * @param folder Optional folder in Cloudinary to store the image.
 * @returns Cloudinary upload response.
 */
export async function uploadImageBufferToCloudinary(
  imageBuffer: Buffer,
  filename?: string,
  folder?: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Unknown Cloudinary upload error.'));
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
}
