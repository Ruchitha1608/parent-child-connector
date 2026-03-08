let cloudinary;
let cloudinaryAvailable = false;

async function initMinio() {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('[Cloudinary] Not configured — media upload disabled');
      return;
    }
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.api.ping();
    cloudinaryAvailable = true;
    console.log('[Cloudinary] Connected');
  } catch (err) {
    console.warn('[Cloudinary] Not available:', err.message);
  }
}

function getMinio() {
  return cloudinary;
}

function getBucket() {
  return null;
}

module.exports = { initMinio, getMinio, getBucket, cloudinaryAvailable: () => cloudinaryAvailable };
