import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class GalleryControler {
    static async getGallery(req: Request, res: Response, next: NextFunction) {
        try {
            const gallery = await client.gallery.findMany({
                include: {
                    media: true
                }
            });

            res.status(200).send({
                success: true,
                message: "All gallery",
                data: gallery,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async getOneGallery(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const gallery = await client.gallery.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (gallery) {
                res.status(200).send({
                    success: true,
                    message: "Gallery",
                    data: gallery
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "Not found"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createGallery(req: Request, res: Response, next: NextFunction) {
        try {
            const { title_uz, title_ru, title_en } = req.body;
            const files = (req.files || []) as Express.Multer.File[];

            const mediaRows =
                files.length > 0
                    ? files.map((f) => ({
                        type: f.mimetype,
                        url: `/uploads/gallery/${f.filename}`,
                    }))
                    : [];

            const created = await client.gallery.create({
                data: {
                    title_uz,
                    title_ru,
                    title_en,
                    media: mediaRows.length ? { createMany: { data: mediaRows } } : undefined,
                },
                include: { media: true },
            });

            return res.status(201).send({
                success: true,
                message: "Gallery created",
                data: created,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status));
        }
    }

    static async updateGallery(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const existing = await client.gallery.findUnique({
                where: { id: Number(id) },
                include: { media: true },
            });

            if (!existing) {
                return res.status(404).send({
                    success: false,
                    message: "This gallery does not exists",
                });
            }

            const { title_uz, title_ru, title_en, remove_media_ids } = req.body;
            const files = (req.files || []) as Express.Multer.File[];

            const mediaToAdd =
                files.length > 0
                    ? files.map((f) => ({
                        type: f.mimetype,
                        url: `/uploads/gallery/${f.filename}`,
                    }))
                    : [];

            const removeIds: number[] = Array.isArray(remove_media_ids)
                ? remove_media_ids.map((x: any) => Number(x)).filter((n) => Number.isFinite(n))
                : [];

            const updated = await client.$transaction(async (tx) => {
                if (removeIds.length) {
                    await tx.gallery_media.deleteMany({
                        where: {
                            id: { in: removeIds },
                            gallery_id: Number(id),
                        },
                    });
                }

                if (mediaToAdd.length) {
                    await tx.gallery_media.createMany({
                        data: mediaToAdd.map((m) => ({ ...m, gallery_id: Number(id) })),
                    });
                }

                return tx.gallery.update({
                    where: { id: Number(id) },
                    data: {
                        title_uz: title_uz ?? undefined,
                        title_ru: title_ru ?? undefined,
                        title_en: title_en ?? undefined,
                    },
                    include: { media: true },
                });
            });

            return res.status(200).send({
                success: true,
                message: "Gallery updated",
                data: updated,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status));
        }
    }

    static async deleteGallery(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const existing = await client.gallery.findUnique({
                where: { id: Number(id) },
                include: { media: true },
            });

            if (!existing) {
                return res.status(404).send({
                    success: false,
                    message: "This gallery does not exists",
                });
            }

            await client.$transaction(async (tx) => {
                await tx.gallery_media.deleteMany({
                    where: { gallery_id: Number(id) },
                });

                await tx.gallery.delete({
                    where: { id: Number(id) },
                });
            });

            return res.status(200).send({
                success: true,
                message: "Gallery deleted",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status));
        }
    }
}