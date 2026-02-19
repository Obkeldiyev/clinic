import { Router } from "express";
import { NewsController } from "../controllers/news.controller";
import { newsUpload } from "../config/newsUploads";
import { requireAdmin } from "src/middlewares/auth.middleware";

const newsRoutes = Router();

newsRoutes.get("/", NewsController.getNews);
newsRoutes.get("/:id", NewsController.getOneNews);
newsRoutes.post("/", requireAdmin, newsUpload.array("media", 15), NewsController.createNews);
newsRoutes.patch("/:id", requireAdmin, newsUpload.array("media", 15), NewsController.updateNews);
newsRoutes.delete("/:id", requireAdmin, NewsController.deleteNews);

export default newsRoutes;
