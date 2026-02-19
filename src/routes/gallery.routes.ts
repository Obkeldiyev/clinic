import { Router } from "express";
import { GalleryControler } from "../controllers/gallery.controller";
import { galleryUpload } from "../config/galleryUploads";
import { requireAdmin } from "src/middlewares/auth.middleware";

const galleryRoutes = Router();

galleryRoutes.get("/", GalleryControler.getGallery);
galleryRoutes.get("/:id", GalleryControler.getOneGallery);
galleryRoutes.post("/", requireAdmin, galleryUpload.array("media", 20), GalleryControler.createGallery);
galleryRoutes.patch("/:id", requireAdmin, galleryUpload.array("media", 20), GalleryControler.updateGallery);
galleryRoutes.delete("/:id", requireAdmin, GalleryControler.deleteGallery);

export default galleryRoutes;