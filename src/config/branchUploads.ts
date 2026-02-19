import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_ROOT = path.join(process.cwd(), "src", "uploads"); // ✅ NOT src/uploads

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolveFolder(fieldname: string) {
  if (fieldname === "branch_media") return "branches";
  if (fieldname.startsWith("service_media__")) return "services";
  if (fieldname.startsWith("tech_media__")) return "techs";
  return "misc";
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = resolveFolder(file.fieldname);
    const dest = path.join(UPLOAD_ROOT, folder);
    ensureDir(dest);
    cb(null, dest);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 40);

    cb(
      null,
      `${Date.now()}_${Math.random().toString(16).slice(2)}_${safeBase}${ext}`,
    );
  },
});

export function inferType(mimetype: string) {
  if (!mimetype) return "file";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "file";
}

/**
 * ✅ Returns URL that you can serve as:
 * http://domain.com/uploads/branches/xxx.png
 */
export function toDbUrl(file: Express.Multer.File) {
  const normalized = file.path.split(path.sep).join("/");
  const idx = normalized.lastIndexOf("/uploads/");
  if (idx === -1) return "/uploads/misc/" + path.basename(normalized);
  return normalized.slice(idx); // "/uploads/branches/...."
}

export const branchUploads = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB per file
    files: 100,
  },
  fileFilter(req, file, cb) {
    const ok =
      file.mimetype?.startsWith("image/") || file.mimetype?.startsWith("video/");
    if (!ok) return cb(new Error("Only image/video files are allowed"));
    cb(null, true);
  },
});
