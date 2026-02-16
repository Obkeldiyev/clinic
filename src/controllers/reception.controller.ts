import { ErrorHandler } from "@errors";
import { PrismaClient, Reception } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

const client = new PrismaClient();

interface decodedToken {
  id: string;
  role: string;
}

export class ReceptionController {
  static async getReceptions(req: Request, res: Response, next: NextFunction) {
    try {
      const reception: Reception[] | [] = await client.reception.findMany({
        include: {
          media: true,
        },
      });

      res.status(200).send({
        success: true,
        message: "All reception staff",
        data: reception,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.messsage, error.status));
    }
  }

  static async getOneReception(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const reception: Reception | null = await client.reception.findUnique({
        where: {
          id,
        },
      });

      if (reception) {
        res.status(200).send({
          success: true,
          message: "Reception found",
          data: reception,
        });
      } else {
        res.status(404).send({
          success: false,
          message: "This reception staff does not exists",
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status));
    }
  }

  static async createreception(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { first_name, second_name, username, password } = req.body;

      const files = (req.files || []) as Express.Multer.File[];

      const checkUsername = await client.reception.findUnique({
        where: { username },
      });

      if (checkUsername) {
        return res.status(409).send({
          success: false,
          message: "Username already taken",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const mediaRows =
        files.length > 0
          ? files.map((f) => ({
              type: f.mimetype,
              url: `/uploads/receptions/${f.filename}`,
            }))
          : [];

      await client.reception.create({
        data: {
          first_name,
          second_name,
          username,
          password: hashedPassword,
          ...(mediaRows.length
            ? {
                media: {
                  createMany: { data: mediaRows },
                },
              }
            : {}),
        },
        include: { media: true },
      });

      return res.status(201).send({
        success: true,
        message: "Reception created",
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status || 500));
    }
  }

  static async getReceptionProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { token } = req.headers;

      const data: decodedToken = (await verify(
        token as string,
        process.env.SECRET_KER as string,
      )) as decodedToken;

      const checkData: Reception | null = await client.reception.findUnique({
        where: {
          id: data.id,
        },
      });

      if (checkData) {
        res.status(200).send({
          success: true,
          message: "The profile of reception staff",
          data: checkData,
        });
      } else {
        res.status(403).send({
          success: false,
          message: "Token required",
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status));
    }
  }

  static async editProfileReception(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { token } = req.headers;
      const { first_name, second_name } = req.body;
      const files = (req.files || []) as Express.Multer.File[];

      const data: decodedToken = (await verify(
        token as string,
        process.env.SECRET_KEY as string,
      )) as decodedToken;

      const checkData: Reception | null = await client.reception.findUnique({
        where: {
          id: data.id,
        },
      });

      if (checkData) {
        const mediaRows =
          files.length > 0
            ? files.map((f) => ({
                type: f.mimetype,
                url: `/uploads/receptions/${f.filename}`,
              }))
            : [];

        await client.reception.update({
          where: {
            id: data.id,
          },
          data: {
            first_name,
            second_name,
            ...(mediaRows.length
              ? {
                  media: {
                    createMany: { data: mediaRows },
                  },
                }
              : {}),
          },
          include: { media: true },
        });

        res.status(200).send({
          success: true,
          message: "The reception updated successfully",
        });
      } else {
        res.status(403).send({
          success: false,
          message: "Token required",
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status));
    }
  }

  static async deleteProfileReception(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const checkData: Reception | null = await client.reception.findUnique({
        where: {
          id,
        },
      });

      if (checkData) {
        await client.reception.delete({
          where: {
            id,
          },
        });

        res.status(200).send({
          success: true,
          message: "The reception deleted successfully",
        });
      } else {
        res.status(404).send({
          success: false,
          message: "This reception staff does not exists",
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status));
    }
  }

  static async loginReception(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      const checkData = await client.reception.findUnique({
        where: {
          username,
        },
      });

      if (checkData) {
        const isValid = await bcrypt.compare(password, checkData.password);

        if (isValid) {
          const access_token = await sign(
            { id: checkData.id, role: checkData.role },
            process.env.SECRET_KEY as string,
          );
          const refresh_token = await sign(
            { id: checkData.id, role: checkData.role },
            process.env.SECRET_KEY as string,
          );

          res.status(200).send({
            success: true,
            message: "Welcome back reception staff",
            data: [access_token, refresh_token],
          });
        } else {
          res.status(400).send({
            success: false,
            message: "Wrong username or password",
          });
        }
      } else {
        res.status(400).send({
          success: false,
          message: "Wrong username or password",
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status));
    }
  }

  static async editUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldUsername, newUsername } = req.body;
      const { token } = req.headers;

      const data: decodedToken = (await verify(
        token as string,
        process.env.SECRET_KEY as string,
      )) as decodedToken;

      const checkData = await client.reception.findUnique({
        where: {
          id: data.id,
        },
      });

      if (checkData) {
        if (oldUsername === checkData.username) {
          const checkNewUsername = await client.reception.findUnique({
            where: {
              username: newUsername,
            },
          });

          if (!checkNewUsername) {
            await client.reception.update({
              where: {
                id: data.id,
              },
              data: {
                username: newUsername,
              },
            });

            res.status(200).send({
              success: true,
              message: "The username updated successfully",
            });
          } else {
            res.status(409).send({
              success: false,
              message: "The new username has already taken",
            });
          }
        } else {
          res.status(400).send({
            success: false,
            message: "The old username is incorrect",
          });
        }
      } else {
        res.status(403).send({
          success: false,
          message: "Token required",
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status));
    }
  }

  static async editPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const { token } = req.headers;

      const data: decodedToken = (await verify(
        token as string,
        process.env.SECRET_KEY as string,
      )) as decodedToken;

      const checkData = await client.reception.findUnique({
        where: {
          id: data.id,
        },
      });

      if (checkData) {
        const isValid = await bcrypt.compare(oldPassword, checkData.password)
        if (isValid) {
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          await client.reception.update({
            where: {
                id: data.id
            },
            data: {
                password: hashedPassword
            }
          });

          res.status(200).send({
            success: true,
            message: "Password updated successfully"
          })
        } else {
          res.status(400).send({
            success: false,
            message: "The old password is incorrect",
          });
        }
      } else {
        res.status(403).send({
          success: false,
          message: "Token required",
        });
      }
    } catch (error: any) {
        next(new ErrorHandler(error.message, error.status))
    }
  }
}
