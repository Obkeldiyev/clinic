import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "branch-techs");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `tech-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const techUploads = multer({ storage }).array("tech_media", 15);

export const techToDbUrl = (file: Express.Multer.File) =>
  `/uploads/branch-techs/${file.filename}`;

export const inferType = (mimetype: string) =>
  mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
