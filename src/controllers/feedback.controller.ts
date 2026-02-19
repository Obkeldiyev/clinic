import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class FeedbackController {
    static async getAllFeedBacks(req: Request, res: Response, next: NextFunction) {
        try {
            const feedbacks = await client.feedback.findMany();

            res.status(200).send({
                success: true,
                message: "All feedbacks",
                data: feedbacks
            })
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async getApprovedFeedbacks(req: Request, res: Response, next: NextFunction) {
        try {
            const feedbacks = await client.feedback.findMany({
                where: {
                    isApproved: true
                }
            });

            res.status(200).send({
                success: true,
                message: "All approved feedbacks",
                data: feedbacks
            })
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async leaveFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone_number, email, full_name, content } = req.body;

            await client.feedback.create({
                data: {
                    phone_number,
                    email,
                    full_name,
                    content
                }
            });

            res.status(200).send({
                success: true,
                message: "feedback created successfully"
            })
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deleteFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const feedback = await client.feedback.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (feedback) {
                await client.feedback.delete({
                    where: {
                        id: Number(id)
                    }
                });

                res.status(200).send({
                    success: true,
                    message: "The feedback deleted"
                })
            } else {
                res.status(404).send({
                    success: false,
                    message: "This feedback does not exists"
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async approveFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const feedback = await client.feedback.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (feedback) {
                await client.feedback.update({
                    data: {
                        isApproved: true,
                    },
                    where: {
                        id: Number(id)
                    }
                })
            } else {
                res.status(404).send({
                    success: false,
                    message: "This feedback does not exists"
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}