import { Router } from "express";
import { ReceptionController } from "../controllers/reception.controller";
import { receptionUpload } from "../config/receptionUpload";
import { requireAdmin, requireAuth } from "src/middlewares/auth.middleware";

const receptionRoutes = Router();

receptionRoutes.get("/", requireAdmin, ReceptionController.getReceptions);
receptionRoutes.get("/:id", requireAdmin, ReceptionController.getOneReception);
receptionRoutes.post("/", requireAdmin, receptionUpload.array("media", 15), ReceptionController.createreception);
receptionRoutes.post("/login", ReceptionController.loginReception);
receptionRoutes.get("/profile/me", requireAuth, ReceptionController.getReceptionProfile);
receptionRoutes.patch(
  "/profile/me",
  requireAuth,
  receptionUpload.array("media", 15),
  ReceptionController.editProfileReception
);
receptionRoutes.patch("/edit-username", requireAuth, ReceptionController.editUsername);
receptionRoutes.patch("/edit-password", requireAuth, ReceptionController.editPassword);
receptionRoutes.delete("/:id", requireAdmin, ReceptionController.deleteProfileReception);

export default receptionRoutes;
