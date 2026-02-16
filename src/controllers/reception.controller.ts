import { ErrorHandler } from "@errors";
import { PrismaClient, Reception } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class ReceptionController {
    static async getReceptions(req: Request, res: Response, next: NextFunction) {
        try {
            const reception: Reception[] | [] = await client.reception.findMany({
                include: {
                    media: true
                }
            });

            res.status(200).send({
                success: true, 
                message: "All reception staff",
                data: reception
            })
        } catch (error: any) {
            next(new ErrorHandler(error.messsage, error.status))
        }
    }

    static async createreception(req: Request, res: Response, next: NextFunction) {
        
    }
}