// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, run } from "../db"; // NEW: Import query and run from db.ts
import { User } from "../interfaces/user"; // NEW: Import User interface

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    // Check if user already exists
    const existingUsers: User[] = await query(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    // For SQLite, boolean is 0 or 1. For MySQL, it's BOOLEAN.
    const isAdminValue = false; // Default to not admin for new registrations
    await run(
      `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`,
      [username, hashedPassword, isAdminValue]
    );

    return res.status(201).json({ message: "User registered successfully." });
  } catch (error: any) {
    console.error("Error during registration:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    // El userId viene del token de acceso (req.user.id)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { query } = await import('../db');
    const now = new Date().toISOString();
    const sessions = await query(
      `SELECT id, token, expires_at, created_at, user_agent FROM refresh_tokens WHERE user_id = ? AND revoked = 0 AND expires_at > ? ORDER BY created_at DESC`,
      [userId, now]
    );
    return res.status(200).json(sessions);
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch sessions.' });
  }
};

export const revokeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ message: 'Missing user or session id' });
    }
    const { query, run } = await import('../db');
    // Verifica que la sesión pertenezca al usuario
    const session = await query('SELECT * FROM refresh_tokens WHERE id = ? AND user_id = ?', [sessionId, userId]);
    if (!session || session.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    await run('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [sessionId]);
    return res.status(200).json({ message: 'Session revoked' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not revoke session.' });
  }
};

export const logoutAllSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { revokeAllRefreshTokensForUser } = await import('../db');
    await revokeAllRefreshTokensForUser(userId);
    return res.status(200).json({ message: 'All sessions revoked.' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not revoke all sessions.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required." });
  }
  try {
    const { revokeRefreshToken } = await import('../db');
    await revokeRefreshToken(refreshToken);
    return res.status(200).json({ message: "Logged out (refresh token revoked)." });
  } catch (err) {
    return res.status(401).json({ message: "Could not revoke refresh token." });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required." });
  }
  try {
    // 1. Verifica firma y expiración JWT
    const payload = jwt.verify(refreshToken, process.env.SECRET as string) as any;
    if (payload.type !== 'refresh') {
      return res.status(401).json({ message: "Invalid refresh token type." });
    }

    // 2. Busca el token en la base de datos
    const { findRefreshToken, revokeRefreshToken, insertRefreshToken } = await import('../db');
    const tokenDb = await findRefreshToken(refreshToken);
    if (!tokenDb) {
      return res.status(401).json({ message: "Refresh token not found." });
    }
    if (tokenDb.revoked) {
      return res.status(401).json({ message: "Refresh token revoked." });
    }
    const now = new Date();
    const expiresAt = new Date(tokenDb.expires_at);
    if (expiresAt < now) {
      return res.status(401).json({ message: "Refresh token expired." });
    }

    // 3. Revoca el refresh token anterior
    await revokeRefreshToken(refreshToken);

    // 4. Genera nuevos tokens
    const newToken = jwt.sign(
      { id: payload.id, username: payload.username, isAdmin: payload.isAdmin },
      process.env.SECRET as string,
      { expiresIn: "10m" }
    );
    const newRefreshToken = jwt.sign(
      { id: payload.id, username: payload.username, isAdmin: payload.isAdmin, type: 'refresh' },
      process.env.SECRET as string,
      { expiresIn: "1h" }
    );
    // 5. Guarda el nuevo refresh token
    const decoded: any = jwt.decode(newRefreshToken);
    const newExpiresAt = new Date(decoded.exp * 1000).toISOString();
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    await insertRefreshToken(payload.id, newRefreshToken, newExpiresAt, userAgent);

    return res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    // Fetch user from database
    const users: User[] = await query(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );
    const user = users[0]; // Assuming username is unique

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Compare password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate access token
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.SECRET as string,
      { expiresIn: "10m" }
    );

    // Generate refresh token (with claim type: 'refresh')
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin, type: 'refresh' },
      process.env.SECRET as string,
      { expiresIn: "1h" }
    );

    // Guarda el refresh token en la base de datos
    const decoded: any = jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    const { insertRefreshToken } = await import('../db');
    await insertRefreshToken(user.id, refreshToken, expiresAt, userAgent);

    return res.status(200).json({ message: "Login successful.", token, refreshToken });
  } catch (error: any) {
    console.error(
      "Error during login:",
      (error.message + " :" + process.env.SECRET) as string
    );
    return res
      .status(500)
      .json({ message: "Internal server error during login." });
  }
};
