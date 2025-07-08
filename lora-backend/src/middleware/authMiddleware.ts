// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extender la interfaz Request para añadir la propiedad user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string; isAdmin: boolean };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // console.log("[authMiddleware] Todos los headers recibidos:", req.headers);
  const authHeader = req.headers["authorization"];
  // console.log("[authMiddleware] Authorization header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1]; // Formato: Bearer TOKEN
  // console.log("[authMiddleware] Token extraído:", token);

  if (token == null) {
    // console.warn("[authMiddleware] No token provided");
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.SECRET as string, (err: any, user: any) => {
    if (err) {
      // console.error("[authMiddleware] JWT verification error:", err.message);
      return res.status(403).json({ message: "Invalid token." });
    }
    // console.log("[authMiddleware] Payload JWT decodificado:", user);
    req.user = user; // Guarda la información del usuario en la petición
    next();
  });
};
