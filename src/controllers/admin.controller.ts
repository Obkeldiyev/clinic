import { ErrorHandler } from "@errors";
import { Admin, PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class AdminController {
    static async createAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, password } = req.body;

            const checkUsername: Admin | null = await client.admin.findUnique({
                where: {
                    username
                }
            });

            if (checkUsername) {
                res.status(409).send({
                    success: false,
                    message: "This username already taken"
                })
            } else {
                await client.admin.create({
                    data: {
                        username,
                        password
                    }
                });

                res.status(201).send({
                    success: true,
                    message: "Admin created successfully"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async getAdmins(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}