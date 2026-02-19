import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class NewsController {
    static async getNews(req: Request, res: Response, next: NextFunction) {
        try {
            const news = await client.news.findMany({
                include: {
                    media: true
                }
            });

            res.status(200).send({
                success: true,
                message: "All news",
                data: news
            });
        } catch (error: any) {
            next(new ErrorHandler(error.meessage, error.status))
        }
    }

    static async getOneNews(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const news = await client.news.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (news) {
                res.status(200).send({
                    success: true,
                    message: "Found the news",
                    data: news
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "This news does not exists"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createNews(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                title_uz,
                title_ru,
                title_en,
                description_uz,
                description_ru,
                description_en,
            } = req.body;

            const files = (req.files || []) as Express.Multer.File[];

            const mediaRows =
                files.length > 0
                    ? files.map((f) => ({
                        type: f.mimetype,
                        url: `/uploads/news/${f.filename}`,
                    }))
                    : [];

            const created = await client.news.create({
                data: {
                    title_uz,
                    title_ru,
                    title_en,
                    description_uz,
                    description_ru,
                    description_en,
                    media: mediaRows.length ? { createMany: { data: mediaRows } } : undefined,
                },
                include: { media: true },
            });

            return res.status(201).send({
                success: true,
                message: "News created",
                data: created,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status));
        }
    }

    static async updateNews(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const existing = await client.news.findUnique({
                where: { id: Number(id) },
                include: { media: true },
            });

            if (!existing) {
                return res.status(404).send({
                    success: false,
                    message: "This news does not exists",
                });
            }

            const {
                title_uz,
                title_ru,
                title_en,
                description_uz,
                description_ru,
                description_en,
                remove_media_ids,
            } = req.body;

            const files = (req.files || []) as Express.Multer.File[];

            const mediaToAdd =
                files.length > 0
                    ? files.map((f) => ({
                        type: f.mimetype,
                        url: `/uploads/news/${f.filename}`,
                    }))
                    : [];

            const removeIds: number[] = Array.isArray(remove_media_ids)
                ? remove_media_ids.map((x: any) => Number(x)).filter((n) => Number.isFinite(n))
                : [];

            const updated = await client.$transaction(async (tx) => {
                if (removeIds.length) {
                    await tx.news_media.deleteMany({
                        where: {
                            id: { in: removeIds },
                            news_id: Number(id),
                        },
                    });
                }

                if (mediaToAdd.length) {
                    await tx.news_media.createMany({
                        data: mediaToAdd.map((m) => ({ ...m, news_id: Number(id) })),
                    });
                }

                return tx.news.update({
                    where: { id: Number(id) },
                    data: {
                        title_uz: title_uz ?? undefined,
                        title_ru: title_ru ?? undefined,
                        title_en: title_en ?? undefined,
                        description_uz: description_uz ?? undefined,
                        description_ru: description_ru ?? undefined,
                        description_en: description_en ?? undefined,
                    },
                    include: { media: true },
                });
            });

            return res.status(200).send({
                success: true,
                message: "News updated",
                data: updated,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status));
        }
    }

    static async deleteNews(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const existing = await client.news.findUnique({
                where: { id: Number(id) },
                include: { media: true },
            });

            if (!existing) {
                return res.status(404).send({
                    success: false,
                    message: "This news does not exists",
                });
            }

            await client.$transaction(async (tx) => {
                await tx.news_media.deleteMany({
                    where: { news_id: Number(id) },
                });

                await tx.news.delete({
                    where: { id: Number(id) },
                });
            });

            return res.status(200).send({
                success: true,
                message: "News deleted",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status));
        }
    }
}