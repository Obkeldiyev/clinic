import { Router } from "express";
import aboutRoutes from "./about_us.routes";
import infoRoutes from "./additional_info.routes";
import adminRoutes from "./admin.routes";
import branchRoutes from "./branch.routes";
import contactRoutes from "./contact.routes";
import doctorRoutes from "./doctor.routes";
import feedbackRoutes from "./feedback.routes";
import galleryRoutes from "./gallery.routes";
import newsRoutes from "./news.routes";
import patientRoutes from "./patient.routes";
import receptionRoutes from "./reception.routes";
import statisticsRoutes from "./statistics.routes";

const router: Router = Router();

router.use("/about/us", aboutRoutes);
router.use("/additional/info", infoRoutes);
router.use("/admin", adminRoutes);
router.use("/branch", branchRoutes);
router.use("/contact", contactRoutes);
router.use("/doctor", doctorRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/gallery", galleryRoutes);
router.use("/news", newsRoutes);
router.use("/patient", patientRoutes);
router.use("/reception", receptionRoutes);
router.use("/statistics", statisticsRoutes)

export default router;