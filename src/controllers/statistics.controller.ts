import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class StatisticsController {
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const statistics = await client.statistics.findMany();

            res.status(200).send({
                success: true,
                message: "All statistics",
                data: statistics
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const { title_en, title_ru, title_uz, number } = req.body;

            await client.statistics.create({
                data: {
                    title_en,
                    title_ru,
                    title_uz,
                    number
                }
            });

            res.status(200).send({
                success: true,
                message: "statistics added successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { title_en, title_ru, title_uz, number } = req.body;

            await client.statistics.update({
                data: {
                    title_en,
                    title_ru,
                    title_uz,
                    number
                },
                where: {
                    id: Number(id)
                }
            });

            res.status(200).send({
                success: true,
                message: "statistics updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deleteStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await client.statistics.delete({
                where: {
                    id: Number(id)
                }
            });

            res.status(200).send({
                success: true,
                message: "statistics updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}