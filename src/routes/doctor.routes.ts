import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";
import { doctorUploads } from "../config/doctorUploads";
import { requireAdmin } from "src/middlewares/auth.middleware";

const doctorRoutes = Router();

doctorRoutes.get("/", DoctorController.getDoctors);
doctorRoutes.get("/:id", DoctorController.getOneDoctor);
doctorRoutes.post("/", requireAdmin, doctorUploads, DoctorController.createDoctors);
doctorRoutes.patch("/:id", requireAdmin, doctorUploads, DoctorController.editDoctors);
doctorRoutes.delete("/:id", requireAdmin, DoctorController.deleteDoctor);

export default doctorRoutes;
