import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";
import { requireAdmin } from "src/middlewares/auth.middleware";

const contactRoutes = Router();

contactRoutes.get("/", ContactController.getContacts);
contactRoutes.post("/", requireAdmin, ContactController.createContacts);
contactRoutes.patch("/:id", requireAdmin, ContactController.editContacts);
contactRoutes.delete("/:id", requireAdmin, ContactController.deleteContacts);

export default contactRoutes;
