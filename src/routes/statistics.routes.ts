import { Router } from "express";
import { StatisticsController } from "../controllers/statistics.controller";
import { requireAdmin } from "src/middlewares/auth.middleware";

const statisticsRoutes = Router();

statisticsRoutes.get("/", StatisticsController.getStatistics);
statisticsRoutes.post("/", requireAdmin, StatisticsController.createStatistics);
statisticsRoutes.put("/:id", requireAdmin, StatisticsController.editStatistics);
statisticsRoutes.delete("/:id", requireAdmin, StatisticsController.deleteStatistics);

export default statisticsRoutes;
