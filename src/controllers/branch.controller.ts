import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { inferType, toDbUrl } from "src/config/branchUploads";

const client = new PrismaClient();

type AnyObj = Record<string, any>;

function safeJsonParse<T>(raw: any, fallback: T): T {
    if (!raw) return fallback;
    if (typeof raw === "object") return raw as T;
    if (typeof raw !== "string") return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function parseIds(raw: any): number[] {
    const arr = safeJsonParse<any[]>(raw, []);
    if (!Array.isArray(arr)) return [];
    return arr.map(Number).filter((n) => !Number.isNaN(n));
}

function groupFilesByField(files: Express.Multer.File[]) {
    const map = new Map<string, Express.Multer.File[]>();
    for (const f of files) {
        const arr = map.get(f.fieldname) ?? [];
        arr.push(f);
        map.set(f.fieldname, arr);
    }
    return map;
}

export class BranchController {
    static async getAllBranches(req: Request, res: Response, next: NextFunction) {
        try {
            const branches = await client.branch.findMany({
                include: {
                    media: true,
                    doctors: true,
                    Services: { include: { media: true } },
                    Branch_techs: { include: { media: true } },
                },
                orderBy: { id: "desc" },
            });

            res.status(200).send({
                success: true,
                message: "All branches",
                data: branches,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async getOnebranch(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) throw new ErrorHandler("Invalid branch id", 400);

            const branch = await client.branch.findUnique({
                where: { id },
                include: {
                    media: true,
                    doctors: true,
                    Services: { include: { media: true } },
                    Branch_techs: { include: { media: true } },
                },
            });

            if (!branch) {
                return res.status(404).send({
                    success: false,
                    message: "This branch does not exists",
                });
            }

            res.status(200).send({
                success: true,
                message: "Branch found",
                data: branch,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async createBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, description } = req.body;

            if (!title || !description) {
                throw new ErrorHandler("title and description are required", 400);
            }

            const services = safeJsonParse<any[]>(req.body.services, []);
            const techs = safeJsonParse<any[]>(req.body.techs, []);

            if (!Array.isArray(services)) throw new ErrorHandler("services must be JSON array", 400);
            if (!Array.isArray(techs)) throw new ErrorHandler("techs must be JSON array", 400);

            const files = (req.files || []) as Express.Multer.File[];
            const filesByField = groupFilesByField(files);

            const created = await client.$transaction(async (tx) => {
                const branch = await tx.branch.create({
                    data: { title, description },
                });

                const branchFiles = filesByField.get("branch_media") ?? [];
                if (branchFiles.length) {
                    await tx.branch_media.createMany({
                        data: branchFiles.map((f) => ({
                            branch_id: branch.id,
                            url: toDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    });
                }

                for (const s of services) {
                    const key = String(s?.key ?? "");
                    const title_en = s?.title_en;
                    const title_ru = s?.title_ru;
                    const title_uz = s?.title_uz;
                    const price = Number(s?.price);

                    if (!key) throw new ErrorHandler("Each service must have 'key'", 400);
                    if (!title_en || !title_ru || !title_uz) {
                        throw new ErrorHandler(`Service(${key}) title_en/title_ru/title_uz are required`, 400);
                    }
                    if (Number.isNaN(price)) throw new ErrorHandler(`Service(${key}) price must be number`, 400);

                    const service = await tx.service.create({
                        data: {
                            branch_id: branch.id,
                            title_en,
                            title_ru,
                            title_uz,
                            price,
                        },
                    });

                    const serviceFiles = filesByField.get(`service_media__${key}`) ?? [];
                    if (serviceFiles.length) {
                        await tx.service_media.createMany({
                            data: serviceFiles.map((f) => ({
                                service_id: service.id,
                                url: toDbUrl(f),
                                type: inferType(f.mimetype),
                            })),
                        });
                    }
                }

                for (const t of techs) {
                    const key = String(t?.key ?? "");
                    const tTitle = t?.title;
                    const tDesc = t?.description;

                    if (!key) throw new ErrorHandler("Each tech must have 'key'", 400);
                    if (!tTitle || !tDesc) throw new ErrorHandler(`Tech(${key}) title/description are required`, 400);

                    const tech = await tx.branch_techs.create({
                        data: {
                            branch_id: branch.id,
                            title: tTitle,
                            description: tDesc,
                        },
                    });

                    const techFiles = filesByField.get(`tech_media__${key}`) ?? [];
                    if (techFiles.length) {
                        await tx.branch_techs_media.createMany({
                            data: techFiles.map((f) => ({
                                branch_techs_id: tech.id,
                                url: toDbUrl(f),
                                type: inferType(f.mimetype),
                            })),
                        });
                    }
                }

                return tx.branch.findUnique({
                    where: { id: branch.id },
                    include: {
                        media: true,
                        doctors: true,
                        Services: { include: { media: true } },
                        Branch_techs: { include: { media: true } },
                    },
                });
            });

            res.status(201).send({
                success: true,
                message: "Branch created successfully",
                data: created,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status || 500));
        }
    }

    static async editBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const branchId = Number(req.params.id);
            if (Number.isNaN(branchId)) throw new ErrorHandler("Invalid branch id", 400);

            const exists = await client.branch.findUnique({ where: { id: branchId } });
            if (!exists) throw new ErrorHandler("Branch not found", 404);

            const files = (req.files || []) as Express.Multer.File[];
            const filesByField = groupFilesByField(files);

            const {
                title,
                description,
                delete_branch_media_ids,

                services_upsert,
                delete_service_ids,
                delete_service_media_ids,

                techs_upsert,
                delete_tech_ids,
                delete_tech_media_ids,
            } = req.body;

            const delBranchMediaIds = parseIds(delete_branch_media_ids);
            const delServiceIds = parseIds(delete_service_ids);
            const delServiceMediaIds = parseIds(delete_service_media_ids);
            const delTechIds = parseIds(delete_tech_ids);
            const delTechMediaIds = parseIds(delete_tech_media_ids);

            const servicesArr = safeJsonParse<any[]>(services_upsert, []);
            const techsArr = safeJsonParse<any[]>(techs_upsert, []);

            if (!Array.isArray(servicesArr)) throw new ErrorHandler("services_upsert must be JSON array", 400);
            if (!Array.isArray(techsArr)) throw new ErrorHandler("techs_upsert must be JSON array", 400);

            const updated = await client.$transaction(async (tx) => {
                if (delBranchMediaIds.length) {
                    await tx.branch_media.deleteMany({
                        where: { id: { in: delBranchMediaIds }, branch_id: branchId },
                    });
                }

                await tx.branch.update({
                    where: { id: branchId },
                    data: {
                        title: title ?? undefined,
                        description: description ?? undefined,
                    },
                });

                const branchFiles = filesByField.get("branch_media") ?? [];
                if (branchFiles.length) {
                    await tx.branch_media.createMany({
                        data: branchFiles.map((f) => ({
                            branch_id: branchId,
                            url: toDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    });
                }

                if (delServiceMediaIds.length) {
                    await tx.service_media.deleteMany({
                        where: {
                            id: { in: delServiceMediaIds },
                            service: { branch_id: branchId },
                        },
                    });
                }

                if (delServiceIds.length) {
                    await tx.service_media.deleteMany({
                        where: { service_id: { in: delServiceIds }, service: { branch_id: branchId } },
                    });
                    await tx.service.deleteMany({
                        where: { id: { in: delServiceIds }, branch_id: branchId },
                    });
                }

                for (const s of servicesArr) {
                    const maybeId = s?.id != null ? Number(s.id) : null;
                    const key = s?.key != null ? String(s.key) : null;

                    const title_en = s?.title_en;
                    const title_ru = s?.title_ru;
                    const title_uz = s?.title_uz;
                    const price = s?.price != null ? Number(s.price) : null;

                    if (!title_en || !title_ru || !title_uz) {
                        throw new ErrorHandler("Service title_en/title_ru/title_uz are required", 400);
                    }
                    if (price == null || Number.isNaN(price)) throw new ErrorHandler("Service price must be number", 400);

                    if (maybeId && !Number.isNaN(maybeId)) {
                        const serviceExists = await tx.service.findFirst({
                            where: { id: maybeId, branch_id: branchId },
                        });
                        if (!serviceExists) throw new ErrorHandler(`Service(${maybeId}) not found in this branch`, 404);

                        await tx.service.update({
                            where: { id: maybeId },
                            data: { title_en, title_ru, title_uz, price },
                        });

                        const svcFiles = filesByField.get(`service_media__${maybeId}`) ?? [];
                        if (svcFiles.length) {
                            await tx.service_media.createMany({
                                data: svcFiles.map((f) => ({
                                    service_id: maybeId,
                                    url: toDbUrl(f),
                                    type: inferType(f.mimetype),
                                })),
                            });
                        }
                        continue;
                    }

                    if (!key) throw new ErrorHandler("New service must include 'key' for media mapping", 400);

                    const createdService = await tx.service.create({
                        data: {
                            branch_id: branchId,
                            title_en,
                            title_ru,
                            title_uz,
                            price,
                        },
                    });

                    const svcFiles = filesByField.get(`service_media__${key}`) ?? [];
                    if (svcFiles.length) {
                        await tx.service_media.createMany({
                            data: svcFiles.map((f) => ({
                                service_id: createdService.id,
                                url: toDbUrl(f),
                                type: inferType(f.mimetype),
                            })),
                        });
                    }
                }

                if (delTechMediaIds.length) {
                    await tx.branch_techs_media.deleteMany({
                        where: {
                            id: { in: delTechMediaIds },
                            branch_techs: { branch_id: branchId },
                        },
                    });
                }

                if (delTechIds.length) {
                    await tx.branch_techs_media.deleteMany({
                        where: { branch_techs_id: { in: delTechIds }, branch_techs: { branch_id: branchId } },
                    });
                    await tx.branch_techs.deleteMany({
                        where: { id: { in: delTechIds }, branch_id: branchId },
                    });
                }

                for (const t of techsArr) {
                    const maybeId = t?.id != null ? Number(t.id) : null;
                    const key = t?.key != null ? String(t.key) : null;

                    const tTitle = t?.title;
                    const tDesc = t?.description;

                    if (!tTitle || !tDesc) throw new ErrorHandler("Tech title/description are required", 400);

                    if (maybeId && !Number.isNaN(maybeId)) {
                        const techExists = await tx.branch_techs.findFirst({
                            where: { id: maybeId, branch_id: branchId },
                        });
                        if (!techExists) throw new ErrorHandler(`Tech(${maybeId}) not found in this branch`, 404);

                        await tx.branch_techs.update({
                            where: { id: maybeId },
                            data: { title: tTitle, description: tDesc },
                        });

                        const techFiles = filesByField.get(`tech_media__${maybeId}`) ?? [];
                        if (techFiles.length) {
                            await tx.branch_techs_media.createMany({
                                data: techFiles.map((f) => ({
                                    branch_techs_id: maybeId,
                                    url: toDbUrl(f),
                                    type: inferType(f.mimetype),
                                })),
                            });
                        }
                        continue;
                    }

                    if (!key) throw new ErrorHandler("New tech must include 'key' for media mapping", 400);

                    const createdTech = await tx.branch_techs.create({
                        data: {
                            branch_id: branchId,
                            title: tTitle,
                            description: tDesc,
                        },
                    });

                    const techFiles = filesByField.get(`tech_media__${key}`) ?? [];
                    if (techFiles.length) {
                        await tx.branch_techs_media.createMany({
                            data: techFiles.map((f) => ({
                                branch_techs_id: createdTech.id,
                                url: toDbUrl(f),
                                type: inferType(f.mimetype),
                            })),
                        });
                    }
                }

                return tx.branch.findUnique({
                    where: { id: branchId },
                    include: {
                        media: true,
                        doctors: true,
                        Services: { include: { media: true } },
                        Branch_techs: { include: { media: true } },
                    },
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

            const branch = await client.branch.findUnique({
                where: { id },
                include: {
                    doctors: true,
                    Services: true,
                    Branch_techs: true,
                },
            });
            if (!branch) throw new ErrorHandler("Branch not found", 404);

            const doctorsCount = await client.doctor.count({ where: { branch_id: id } });
            if (doctorsCount > 0) {
                throw new ErrorHandler("Cannot delete branch: it has doctors attached", 400);
            }

            await client.$transaction(async (tx) => {
                await tx.service_media.deleteMany({ where: { service: { branch_id: id } } });
                await tx.service.deleteMany({ where: { branch_id: id } });

                await tx.branch_techs_media.deleteMany({ where: { branch_techs: { branch_id: id } } });
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
}
