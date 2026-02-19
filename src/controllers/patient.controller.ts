import { ErrorHandler } from "@errors";
import { Patient, PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class PatientController {
    static async getPatients(req: Request, res: Response, next: NextFunction) {
        try {
            const patients: Patient[] | [] = await client.patient.findMany({
                include: {
                    media: true
                }
            });

            res.status(200).send({
                success: true,
                message: "All patients",
                data: patients,
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.static))
        }
    }

    static async getOnePatient(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const patient: Patient | null = await client.patient.findUnique({
                where: {
                    id
                }
            });

            if (patient) {
                res.status(200).send({
                    success: true,
                    message: "The patient found",
                    data: patient
                })
            } else {
                res.status(404).send({
                    success: false,
                    message: "This patient does not exists"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createPatient(req: Request, res: Response, next: NextFunction) {
        try {
            const { first_name, second_name, third_name, phone_number, problem } = req.body;
            const files = (req.files || []) as Express.Multer.File[];

            const checkPhone_number = await client.patient.findUnique({
                where: {
                    phone_number
                }
            });

            if (checkPhone_number) {
                res.status(409).send({
                    success: false,
                    message: "This patient already exists"
                });
            } else {
                const mediaRows = files.length > 0 ? files.map((f) => ({ type: f.mimetype, url: `/uploads/patients/${f.filename}`,})) : [];

                await client.patient.create({
                    data: {
                        first_name,
                        second_name,
                        third_name,
                        phone_number,
                        problem,
                        media: mediaRows.length ? { createMany: { data: mediaRows } } : undefined,
                    },

                    include: {
                        media: true
                    }
                });

                res.status(200).send({
                    success: true,
                    message: "The patient created successfully",
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deletePatient(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const patient = await client.patient.findUnique({
                where: {
                    id
                },
                include: {
                    media: true
                }
            });

            if (patient) {
                await client.$transaction(async (tx) => {
                    await tx.patientHistory.upsert({
                        where: {
                            phone_number: patient.phone_number,
                        },
                        update: {
                            first_name: patient.first_name,
                            second_name: patient.second_name,
                            third_name: patient.third_name,
                            problem: patient.problem,
                        },
                        create: {
                            first_name: patient.first_name,
                            second_name: patient.second_name,
                            third_name: patient.third_name,
                            phone_number: patient.phone_number,
                            problem: patient.problem,
                        }
                    });

                    await tx.partient_media.deleteMany({
                        where: {
                            patient_id: patient.id
                        }
                    });

                    await tx.patient.delete({
                        where: {
                            id
                        }
                    });
                });

                res.status(200).send({
                    success: true,
                    message: "The patient delete and stored to history successfully",
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "This patient does not exists",
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async getHistoryPatient(req: Request, res: Response, next: NextFunction) {
        try {
            const history = await client.patientHistory.findMany();

            res.status(200).send({
                success: true,
                message: "All history of patients",
                data: history
            })
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}