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

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Login successful.", token });
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
