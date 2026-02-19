import { Router } from "express";
import { FeedbackController } from "../controllers/feedback.controller"; // adjust path if needed
import { requireAuth } from "src/middlewares/auth.middleware";

const feedbackRoutes = Router();

feedbackRoutes.get("/", requireAuth, FeedbackController.getAllFeedBacks);
feedbackRoutes.get("/approved", FeedbackController.getApprovedFeedbacks);
feedbackRoutes.post("/", FeedbackController.leaveFeedback);
feedbackRoutes.patch("/:id/approve", requireAuth, FeedbackController.approveFeedback);
feedbackRoutes.delete("/:id", requireAuth, FeedbackController.deleteFeedback);

export default feedbackRoutes;
