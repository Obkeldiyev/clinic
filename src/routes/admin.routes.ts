import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAdmin } from "src/middlewares/auth.middleware";

const adminRoutes = Router();

adminRoutes.post("/create", requireAdmin, AdminController.createAdmin);
adminRoutes.get("/", requireAdmin, AdminController.getAdmins);
adminRoutes.post("/login", AdminController.login);
adminRoutes.get("/profile", requireAdmin, AdminController.getProfile);
adminRoutes.patch("/edit-username", requireAdmin, AdminController.editUsername);
adminRoutes.patch("/edit-password", requireAdmin, AdminController.editPassword);

export default adminRoutes;
