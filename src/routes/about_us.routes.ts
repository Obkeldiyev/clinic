import { Router } from "express";
import { AboutController } from "../controllers/about.controller";
import { requireAdmin } from "src/middlewares/auth.middleware";

const aboutRoutes = Router();

aboutRoutes.get("/", AboutController.getAbout);
aboutRoutes.post("/", requireAdmin, AboutController.createAbout);
aboutRoutes.patch("/:id", requireAdmin, AboutController.editAbout);
aboutRoutes.delete("/:id", requireAdmin, AboutController.deleteAbout);

export default aboutRoutes;
