import { ErrorHandler } from "@errors";
import { Branch, Doctor, PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { inferType, toDbUrl } from "src/config/doctorUploads";
import fs from "fs";
import path from "path";

const client = new PrismaClient();

type AwardInput = {
    tempKey: string,
    title: string,
    level: string
}

function parseAwards (raw: any): AwardInput[] {
    if (!raw) return [];

    if (Array.isArray(raw)) return raw as AwardInput[];

    if (typeof raw === "string") {
        try {
            return JSON.parse(raw) as AwardInput[];
        } catch {
            throw new Error("Invalid awards JSON")
        }
    }

    return [];
}

function getFiles(req: Request) {
    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    return {
        doctorMedia: files["doctor_media"] || [],
        awardMedia: files["award_media"] || [],
    }
}

function safeUnlink(absPath: string) {
    try {
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath)
    } catch {
    }
}

function urlToAbsPath(url: string) {
    const rel = url.startsWith("/") ? url.slice(1) : url;
    return path.join(process.cwd(), "src", rel)
}

export class DoctorController {
    static async getDoctors(req: Request, res: Response, next: NextFunction) {
        try {
            const doctors: Doctor[] | [] = await client.doctor.findMany({
                include: {
                    media: true,
                    branch: true,
                    awards: {include: {media: true}}
                }
            });

            res.status(200).send({
                success: true,
                message: "All doctors",
                data: doctors
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async getOneDoctor(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const doctor: Doctor | null = await client.doctor.findUnique({
                where: {
                    id
                },
                include: {
                    media: true,
                    branch: true,
                    awards: {include: {media: true}}
                }
            });

            if (doctor) {
                res.status(200).send({
                    success: true,
                    message: "The doctor found",
                    data: doctor
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "This doctor does not exists"
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createDoctors(req: Request, res: Response, next: NextFunction) {
        try {
            const { first_name, second_name, third_name, description, branch_id } = req.body;

            const branchIdNum = Number(branch_id);

            if (Number.isNaN(branchIdNum)) {
                return res.status(400).send({
                    success: false,
                    message: "branch id must be a number"
                })
            }

            const branch: Branch | null = await client.branch.findUnique({
                where: {
                    id: Number(branch_id)
                }
            });

            if (branch) {
                const awards = parseAwards(req.body.awards);
                
                const { doctorMedia, awardMedia } = getFiles(req);

                const created = await client.doctor.create({
                    data: {
                        first_name,
                        second_name,
                        third_name,
                        description,
                        branch_id: branchIdNum,

                        media: {
                            create: doctorMedia.map((f) => ({
                                url: toDbUrl(f),
                                type: inferType(f.mimetype)
                            }))
                        },

                        awards: {
                            create: awards.map((a) => {
                                const matched = awardMedia.filter((f) =>
                                    f.originalname.startsWith(a.tempKey + "_")
                                );

                                return {
                                    title: a.title,
                                    level: a.level,
                                    media: {
                                        create: matched.map((f) => ({
                                            url: toDbUrl(f),
                                            type: inferType(f.mimetype)
                                        }))
                                    }
                                }
                            })
                        }
                    },
                    include: {
                        media: true,
                        branch: true,
                        awards: {include: {media: true}}
                    }
                })
            } else {
                res.status(400).send({
                    success: false,
                    message: "This branch does not exists"
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editDoctors(req: Request, res: Response, next: NextFunction) {
        try {
            const doctorId = req.params.id;

            const exists = await client.doctor.findUnique({ where: { id: doctorId } });
            if (!exists) throw new ErrorHandler("Doctor not found", 404);

            const {
                first_name,
                second_name,
                third_name,
                description,
                branch_id,
                delete_doctor_media_ids,
                delete_award_media_ids,
            } = req.body;

            const branchIdNum = branch_id !== undefined ? Number(branch_id) : undefined;

            if (branch_id !== undefined && Number.isNaN(branchIdNum)) {
                return res.status(400).send({
                    success: false,
                    message: "branch id must be a number"
                })
            }

            if (branchIdNum !== undefined) {
                const br = await client.branch.findUnique({ where: { id: branchIdNum } });
                if (!br) {
                    return res.status(404).send({
                        success: false,
                        message: "Branch not found"
                    })
                }
            }

            const awardsToAdd = parseAwards(req.body.awards);
            const { doctorMedia, awardMedia } = getFiles(req);

            const delDoctorMediaIds: number[] = delete_doctor_media_ids ? JSON.parse(delete_doctor_media_ids) : [];

            const delAwardMediaIds: number[] = delete_award_media_ids ? JSON.parse(delete_award_media_ids) : [];

            const updated = await client.$transaction(async (tx) => {

                if (delDoctorMediaIds.length) {
                    await tx.doctor_media.deleteMany({
                        where: { id: { in: delDoctorMediaIds }, doctor_id: doctorId },
                    });
                }

                if (delAwardMediaIds.length) {
                    await tx.doctor_awards_media.deleteMany({
                        where: { id: { in: delAwardMediaIds } },
                    });
                }

                await tx.doctor.update({
                    where: { id: doctorId },
                    data: {
                        first_name: first_name ?? undefined,
                        second_name: second_name ?? undefined,
                        third_name: third_name ?? undefined,
                        description: description ?? undefined,
                        branch_id: branchIdNum ?? undefined,
                    },
                });

                if (doctorMedia.length) {
                    await tx.doctor_media.createMany({
                        data: doctorMedia.map((f) => ({
                            doctor_id: doctorId,
                            url: toDbUrl(f),
                            type: inferType(f.mimetype),
                        })),
                    });
                }

                for (const a of awardsToAdd) {
                    const createdAward = await tx.doctor_awards.create({
                        data: {
                            doctor_id: doctorId,
                            title: a.title,
                            level: a.level,
                        },
                    });

                    const matched = awardMedia.filter((f) =>
                        f.originalname.startsWith(a.tempKey + "_")
                    );

                    if (matched.length) {
                        await tx.doctor_awards_media.createMany({
                            data: matched.map((f) => ({
                                doctor_awards_id: createdAward.id,
                                url: toDbUrl(f),
                                type: inferType(f.mimetype),
                            })),
                        });
                    }
                }

                return tx.doctor.findUnique({
                    where: { id: doctorId },
                    include: {
                        media: true,
                        branch: true,
                        awards: { include: { media: true } },
                    },
                });
            });

            res.status(200).send({
                success: true,
                message: "Doctor updated",
                data: updated,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deleteDoctor(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const doctor = await client.doctor.findUnique({
                where: {
                    id
                },
                
                include: {
                    media: true,
                    awards: { include: { media: true} }
                }
            });

            if (doctor) {
                const urls: string[] = [...doctor.media.map((m) => m.url), ...doctor.awards.flatMap((a) => a.media.map((m) => m.url))];

                await client.$transaction(async (tx) => {
                    await tx.doctor_awards_media.deleteMany({
                        where: {
                            doctor_awards_id: {
                                in: doctor.awards.map((a) => a.id),
                            }
                        }
                    });

                    await tx.doctor_awards.deleteMany({
                        where: {
                            doctor_id: id
                        }
                    });

                    await tx.doctor_media.deleteMany({
                        where: {
                            doctor_id: id
                        }
                    });

                    await tx.doctor.delete({
                        where: {
                            id
                        }
                    });
                });

                for (const url of urls) {
                    safeUnlink(urlToAbsPath(url))
                }

                res.status(200).send({
                    success: true,
                    message: "Doctor deleted successfully"
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "Doctor not found"
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}