import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class AdditionalInfoController {
    static async getInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const info = await client.additional_info.findMany();

            res.status(200).send({
                success: true,
                message: "All additional informations",
                data: info
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const { title_en, title_ru, title_uz, content_en, content_ru, content_uz } = req.body;

            await client.additional_info.create({
                data: {
                    title_en,
                    title_ru,
                    title_uz,
                    content_en,
                    content_ru,
                    content_uz
                }
            });

            res.status(200).send({
                success: true,
                message: "Additional information data added successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { title_en, title_ru, title_uz, content_en, content_ru, content_uz } = req.body;

            await client.additional_info.update({
                data: {
                    title_en,
                    title_ru,
                    title_uz,
                    content_en,
                    content_ru,
                    content_uz
                },
                where: {
                    id: Number(id)
                }
            });

            res.status(200).send({
                success: true,
                message: "Additional information updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deleteInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await client.additional_info.delete({
                where: {
                    id: Number(id)
                }
            });

            res.status(200).send({
                success: true,
                message: "About updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}