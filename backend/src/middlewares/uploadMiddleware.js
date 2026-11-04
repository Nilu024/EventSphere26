import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(ApiError.badRequest('Only JPEG, PNG or WebP images are allowed'));
    return cb(null, true);
  },
});

function hasImageSignature(buf) {
  if (!buf || buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}

/** Single image upload in field "image", with MIME filter, 2 MB limit and magic-byte verification. */
export const uploadSingleImage = [
  upload.single('image'),
  (req, _res, next) => {
    if (!req.file) return next(ApiError.badRequest('Image file is required (field name: image)'));
    if (!hasImageSignature(req.file.buffer)) return next(ApiError.badRequest('File content is not a valid image'));
    return next();
  },
];
