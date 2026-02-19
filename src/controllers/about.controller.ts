import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class AboutController {
    static async getAbout(req: Request, res: Response, next: NextFunction) {
        try {
            const About = await client.about_us.findMany();

            res.status(200).send({
                success: true,
                message: "All About us",
                data: About
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createAbout(req: Request, res: Response, next: NextFunction) {
        try {
            const { title_en, title_ru, title_uz, content_en, content_ru, content_uz } = req.body;

            await client.about_us.create({
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
                message: "About us data added successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editAbout(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { title_en, title_ru, title_uz, content_en, content_ru, content_uz } = req.body;

            await client.about_us.update({
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
                message: "About updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deleteAbout(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await client.about_us.delete({
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