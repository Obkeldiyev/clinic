import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const uploadPath = path.join(__dirname, "../uploads/gallery");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req: Request, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "video/mp4",
    "video/quicktime",
  ];

  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images and videos are allowed for gallery!"));
};

export const galleryUpload = multer({
  storage,
  fileFilter,
  limits: {
    files: 20,
    fileSize: 2 * 1024 * 1024 * 1024,
  },
});
