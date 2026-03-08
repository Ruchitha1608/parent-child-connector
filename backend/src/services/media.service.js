const { getCloudinary } = require('../config/minio');

async function uploadFile(fileBuffer, originalName, mimeType, folder = 'uploads') {
  const cloudinary = getCloudinary();
  const resourceType = mimeType.startsWith('video/') ? 'video' : 'image';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
}

async function deleteFile(publicId) {
  const cloudinary = getCloudinary();
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadFile, deleteFile };
