import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ErrorHandler } from "@errors";

dotenv.config();

type JwtPayload = {
  id: string;
  role: "ADMIN" | "RECEPTION" | string;
};

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();

  const tokenHeader = req.headers.token;
  if (typeof tokenHeader === "string" && tokenHeader.trim()) return tokenHeader.trim();

  const accessTokenHeader = req.headers.access_token;
  if (typeof accessTokenHeader === "string" && accessTokenHeader.trim())
    return accessTokenHeader.trim();

  return null;
}

function verifyJwt(req: Request): JwtPayload {
  const token = getToken(req);
  if (!token) throw new ErrorHandler("Token required", 401);

  const secret = process.env.SECRET_KEY;
  if (!secret) throw new ErrorHandler("SECRET_KEY is not set", 500);

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    throw new ErrorHandler("Invalid or expired token", 401);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = verifyJwt(req);

    // attach user to req (so controllers can use req.user.id / req.user.role)
    (req as any).user = { id: payload.id, role: payload.role };

    if (payload.role !== "ADMIN" && payload.role !== "RECEPTION") {
      throw new ErrorHandler("Forbidden", 403);
    }

    next();
  } catch (err: any) {
    next(err instanceof ErrorHandler ? err : new ErrorHandler(err.message, err.status || 500));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = verifyJwt(req);

    (req as any).user = { id: payload.id, role: payload.role };

    if (payload.role !== "ADMIN") {
      throw new ErrorHandler("Admin only", 403);
    }

    next();
  } catch (err: any) {
    next(err instanceof ErrorHandler ? err : new ErrorHandler(err.message, err.status || 500));
  }
}
