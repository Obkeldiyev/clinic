import { ErrorHandler } from "@errors";
import { Admin, PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config()

const client = new PrismaClient();

interface token {
    id: String,
    role: String
}

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
                const hashedPassword = await bcrypt.hash(password, 10);
                await client.admin.create({
                    data: {
                        username,
                        password: hashedPassword
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
            const admins: Admin[] | null = await client.admin.findMany();

            res.status(200).send({
                success: true,
                message: "All admins",
                data: admins
            });
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
    
    static async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { access_token } = req.headers;

            const data: token = verify(access_token as string, process.env.SECRET_KEY as string) as token;

            const admin: Admin | null = await client.admin.findUnique({
                where: {
                    id: data.id as string,
                }
            });

            if (admin) {
                res.status(200).send({
                    success: true,
                    message: "Your profile",
                    data: admin
                })
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editUsername(req: Request, res: Response, next: NextFunction) {
        try {
            const { oldusername, newUsername } = req.body;
            const { access_token } = req.headers;

            const data: token = verify(access_token as string, process.env.SECRET_KEY as string) as token;

            const admin: Admin | null = await client.admin.findUnique({
                where: {
                    id: data.id as string
                }
            });

            if (admin) {
                if (admin.username === oldusername) {
                    const checkNewUsername: Admin | null = await client.admin.findUnique({
                        where: {
                            username: newUsername
                        }
                    });

                    if (checkNewUsername) {
                        res.status(409).send({
                            success: false,
                            message: "This username has been taken"
                        });
                    } else {
                        await client.admin.update({
                            data: {
                                username: newUsername,
                            },
                            where: {
                                id: admin.id,
                            }
                        });

                        res.status(200).send({
                            success: true,
                            message: "Username updated successfully"
                        })
                    }
                } else {
                    res.status(400).send({
                        success: false,
                        message: "Your old username is wrong"
                    });
                }
            }else {
                res.status(403).send({
                    success: false,
                    message: "Token required"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async editPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { oldPassword, newPassword } = req.body;
            const { access_token } = req.headers;

            const data: token = verify(access_token as string, process.env.SECRET_KEY as string) as token;

            const admin: Admin | null = await client.admin.findUnique({
                where: {
                    id: data.id as string
                }
            });

            if (admin) {
                const isValid = await bcrypt.compare(oldPassword, admin.password);
                if (isValid) {
                    const newHashedPassword = await bcrypt.hash(newPassword, 10);

                    await client.admin.update({
                        data: {
                            password: newHashedPassword,
                        },
                        where: {
                            id: admin.id
                        }
                    })
                } else {
                    res.status(400).send({
                        success: false,
                        message: "Your old password is wrong"
                    });
                }
            }else {
                res.status(403).send({
                    success: false,
                    message: "Token required"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, password } = req.body;

            const checkUsername: Admin | null = await client.admin.findUnique({
                where: {
                    username
                }
            });

            if (checkUsername) {
                const isValid = await bcrypt.compare(password, checkUsername.password);

                if (isValid) {
                    const access_token = sign({ id: checkUsername.id, role: checkUsername.role }, process.env.SECRET_KEY as string, { expiresIn: "7d" });
                    const refresh_token = sign({ id: checkUsername.id, role: checkUsername.role }, process.env.SECRET_KEY as string);
                    
                    res.status(200).send({
                        success: true,
                        message: "Login successful",
                        tokens: {
                            access_token,
                            refresh_token
                        }
                    });
                } else {
                    res.status(404).send({
                        success: false,
                        message: "Username or password is incorrect"
                    });
                }
            } else {
                res.status(404).send({
                    success: false,
                    message: "Username or password is incorrect"
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message, error.status))
        }
    }
}
