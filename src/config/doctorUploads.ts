import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "src", "uploads", "doctors");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, "_")
      .slice(0, 40);

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  },
});

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!allowed.has(file.mimetype)) {
    return cb(new Error("Only images/videos are allowed"));
  }
  cb(null, true);
}

export const doctorUploads = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024,
  },
}).fields([
  { name: "doctor_media", maxCount: 15 },
  { name: "award_media", maxCount: 30 },
]);

export function toDbUrl(file: Express.Multer.File) {
  return `/uploads/doctors/${file.filename}`;
}

export function inferType(mimetype: string) {
  return mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
}
