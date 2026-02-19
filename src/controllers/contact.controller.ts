import { ErrorHandler } from "@errors";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const client = new PrismaClient();

export class ContactController {
    static async getContacts(req: Request, res: Response, next: NextFunction) {
        try {
            const contacts = await client.contact.findMany();

            res.status(200).send({
                success: true,
                message: "All contacts",
                data: contacts
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async createContacts(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, contact } = req.body;

            await client.contact.create({
                data: {
                    type,
                    contact
                }
            });

            res.status(200).send({
                success: true,
                message: "Contacts added successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editContacts(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { type, contact } = req.body;

            await client.contact.update({
                data: {
                    type,
                    contact
                },
                where: {
                    id: Number(id)
                }
            });

            res.status(200).send({
                success: true,
                message: "Contacts updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async deleteContacts(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await client.contact.delete({
                where: {
                    id: Number(id)
                }
            });

            res.status(200).send({
                success: true,
                message: "Contacts updated successfully",
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}