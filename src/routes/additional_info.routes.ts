import { Router } from "express";
import { AdditionalInfoController } from "../controllers/additional_info.controller";
import { requireAdmin } from "src/middlewares/auth.middleware";

const infoRoutes = Router();

infoRoutes.get("/", AdditionalInfoController.getInfo);
infoRoutes.post("/", requireAdmin, AdditionalInfoController.createInfo);
infoRoutes.patch("/:id", requireAdmin, AdditionalInfoController.editInfo); 
infoRoutes.delete("/:id", requireAdmin, AdditionalInfoController.deleteInfo);

export default infoRoutes;
