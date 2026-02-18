import { ErrorHandler } from "@errors";
import { Branch, PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { inferType, toDbUrl } from "src/config/doctorUploads";
import { techToDbUrl } from "src/config/techUploads";

const client = new PrismaClient();

function parseIds(raw: any): number[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(Number).filter((n) => !Number.isNaN(n));

    if (typeof raw === "string") {
        try {
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return [];
            return arr.map(Number).filter((n) => !Number.isNaN(n));
        } catch {
            return []
        }
    }

    return []
}

export class BranchController {
    static async getAllBranches(req: Request, res: Response, next: NextFunction) {
        try {
            const branches = await client.branch.findMany({
                include: {
                    Branch_techs: { include: { media: true } },
                    doctors: true,
                    media: true
                }
            })

            res.status(200).send({
                success: true,
                message: "All branches",
                data: branches
            })
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async getOnebranch(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const branch: Branch | null = await client.branch.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (branch) {
                res.status(200).send({
                    success: true,
                    message: "The user found",
                    data: branch
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "This branch does not exists"
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, description } = req.body;
            const files = (req.files || []) as Express.Multer.File[];

            if (!title || !description) {
                res.status(400).send({
                    success: false,
                    message: "title and description are required"
                });
            } else {
                const created = await client.branch.create({
                    data: {
                        title,
                        description,
                        media: {
                            create: files.map((f) => ({
                                url: toDbUrl(f),
                                type: inferType(f.mimetype),
                            })),
                        },
                    },
                    include: {
                        media: true
                    }
                });

                res.status(200).send({
                    success: true,
                    message: "Branch created successfully"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
    static async createBranchTech(req: Request, res: Response, next: NextFunction) {
        try {
            const { branch_id, title, description } = req.body;

            if (!branch_id || !title || !description) {
                throw new ErrorHandler("branch_id, title, description are required", 400);
            }

            const branchIdNum = Number(branch_id);
            if (Number.isNaN(branchIdNum)) throw new ErrorHandler("branch_id must be number", 400);

            const branch = await client.branch.findUnique({ where: { id: branchIdNum } });
            if (!branch) throw new ErrorHandler("Branch not found", 404);

            const files = (req.files || []) as Express.Multer.File[];

            const tech = await client.branch_techs.create({
                data: {
                    branch_id: branchIdNum,
                    title,
                    description,
                    media: {
                        create: files.map((f) => ({
                            url: techToDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    },
                },
                include: { media: true, branch: true },
            });

            res.status(201).send({
                success: true,
                message: "Branch tech created",
                data: tech,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async editBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) throw new ErrorHandler("Invalid branch id", 400);

            const exists = await client.branch.findUnique({ where: { id } });
            if (!exists) throw new ErrorHandler("Branch not found", 404);

            const { title, description, delete_media_ids } = req.body;

            const files = (req.files || []) as Express.Multer.File[];
            const deleteIds = parseIds(delete_media_ids);

            const updated = await client.$transaction(async (tx) => {
                if (deleteIds.length) {
                    await tx.branch_media.deleteMany({
                        where: {
                            id: { in: deleteIds },
                            branch_id: id,
                        },
                    });
                }

                await tx.branch.update({
                    where: { id },
                    data: {
                        title: title ?? undefined,
                        description: description ?? undefined,
                    },
                });

                if (files.length) {
                    await tx.branch_media.createMany({
                        data: files.map((f) => ({
                            branch_id: id,
                            url: toDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    });
                }

                return tx.branch.findUnique({
                    where: { id },
                    include: { media: true, Branch_techs: { include: { media: true } }, doctors: true },
                });
            });

            res.status(200).send({
                success: true,
                message: "Branch updated",
                data: updated,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async deleteBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) throw new ErrorHandler("Invalid branch id", 400);

            const exists = await client.branch.findUnique({
                where: { id },
                include: { media: true, Branch_techs: { include: { media: true } } },
            });
            if (!exists) throw new ErrorHandler("Branch not found", 404);

            const doctorsCount = await client.doctor.count({ where: { branch_id: id } });
            if (doctorsCount > 0) {
                throw new ErrorHandler("Cannot delete branch: it has doctors attached", 400);
            }

            await client.$transaction(async (tx) => {
                await tx.branch_techs_media.deleteMany({
                    where: { branch_techs: { branch_id: id } },
                });

                await tx.branch_techs.deleteMany({ where: { branch_id: id } });

                await tx.branch_media.deleteMany({ where: { branch_id: id } });

                await tx.branch.delete({ where: { id } });
            });

            res.status(200).send({
                success: true,
                message: "Branch deleted",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async createTech(req: Request, res: Response, next: NextFunction) {
        try {
            const branchId = Number(req.params.branchId ?? req.body.branch_id);
            if (Number.isNaN(branchId)) throw new ErrorHandler("Invalid branch_id", 400);

            const { title, description } = req.body;
            if (!title || !description) {
                throw new ErrorHandler("title and description are required", 400);
            }

            const branch = await client.branch.findUnique({ where: { id: branchId } });
            if (!branch) throw new ErrorHandler("Branch not found", 404);

            const files = (req.files || []) as Express.Multer.File[];

            const tech = await client.branch_techs.create({
                data: {
                    branch_id: branchId,
                    title,
                    description,
                    media: {
                        create: files.map((f) => ({
                            url: techToDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    },
                },
                include: { media: true, branch: true },
            });

            res.status(201).send({
                success: true,
                message: "Tech created",
                data: tech,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async editTech(req: Request, res: Response, next: NextFunction) {
        try {
            const techId = Number(req.params.id);
            if (Number.isNaN(techId)) throw new ErrorHandler("Invalid tech id", 400);

            const exists = await client.branch_techs.findUnique({ where: { id: techId } });
            if (!exists) throw new ErrorHandler("Tech not found", 404);

            const { title, description, delete_media_ids } = req.body;
            const files = (req.files || []) as Express.Multer.File[];
            const deleteIds = parseIds(delete_media_ids);

            const updated = await client.$transaction(async (tx) => {
                if (deleteIds.length) {
                    await tx.branch_techs_media.deleteMany({
                        where: {
                            id: { in: deleteIds },
                            branch_techs_id: techId,
                        },
                    });
                }

                await tx.branch_techs.update({
                    where: { id: techId },
                    data: {
                        title: title ?? undefined,
                        description: description ?? undefined,
                    },
                });

                if (files.length) {
                    await tx.branch_techs_media.createMany({
                        data: files.map((f) => ({
                            branch_techs_id: techId,
                            url: techToDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    });
                }

                return tx.branch_techs.findUnique({
                    where: { id: techId },
                    include: { media: true, branch: true },
                });
            });

            res.status(200).send({
                success: true,
                message: "Tech updated",
                data: updated,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async deleteTech(req: Request, res: Response, next: NextFunction) {
        try {
            const techId = Number(req.params.id);
            if (Number.isNaN(techId)) throw new ErrorHandler("Invalid tech id", 400);

            const exists = await client.branch_techs.findUnique({
                where: { id: techId },
                include: { media: true },
            });
            if (!exists) throw new ErrorHandler("Tech not found", 404);

            await client.$transaction(async (tx) => {
                await tx.branch_techs_media.deleteMany({ where: { branch_techs_id: techId } });
                await tx.branch_techs.delete({ where: { id: techId } });
            });

            res.status(200).send({
                success: true,
                message: "Tech deleted",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }
}