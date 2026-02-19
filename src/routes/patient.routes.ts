import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { patientUpload } from "../config/patientUploads";
import { requireAuth } from "src/middlewares/auth.middleware";

const patientRoutes = Router();

patientRoutes.get("/", requireAuth, PatientController.getPatients);
patientRoutes.get("/history", requireAuth, PatientController.getHistoryPatient);
patientRoutes.get("/:id", requireAuth, PatientController.getOnePatient);
patientRoutes.post("/", patientUpload.array("media", 15), PatientController.createPatient);
patientRoutes.delete("/:id", requireAuth, PatientController.deletePatient);

export default patientRoutes;
