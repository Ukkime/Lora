// src/db.ts
import mysql from "mysql2/promise"; // MySQL promise-based client
import sqlite3 from "sqlite3"; // SQLite client (callback-based by default)
import { dbConfig } from "./config/db-config"; // Import your DB configuration

import bcrypt from "bcrypt";
import { readFile } from 'fs/promises';

// Define the database connection variable
let dbConnection: mysql.Connection | sqlite3.Database | null = null;

// Function to initialize the database connection
export const initializeDatabase = async () => {
  try {
    if (dbConnection) {
      console.log("Database already initialized.");
      return;
    }

    if (dbConfig.type === "mysql") {
      const mysqlConfig = dbConfig.mysql!;
      dbConnection = await mysql.createConnection({
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
      });
      console.log("Connected to MySQL database.");
      await createUsersTableMySQL(); // Ensure table exists
      await createUserCardsTableMySQL(); // Ensure user_cards table
      await createDecksTableMySQL(); // Ensure decks table
    } else if (dbConfig.type === "sqlite") {
      const sqliteConfig = dbConfig.sqlite!;
      dbConnection = new sqlite3.Database(
        sqliteConfig.database,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (err) => {
          if (err) {
            console.error("Error connecting to SQLite database:", err.message);
            process.exit(1);
          }
          console.log("Connected to SQLite database.");
        }
      );
      await createUsersTableSQLite(); // Ensure table exists
      await createUserCardsTableSQLite(); // Ensure user_cards table
      await createDecksTableSQLite(); // Ensure decks table
      await createRefreshTokensTableSQLite(); // NEW: Ensure refresh_tokens table
    } else {
      throw new Error("Unsupported database type specified in config.");
    }
    await seedInitialUsers(); // Seed initial data for both DB types
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1); // Exit if DB connection fails
  }
};

// Function to execute a query
// This function needs to handle the differences in query execution between MySQL and SQLite
export async function query(sql: string, params?: any[]): Promise<any> {
  if (!dbConnection) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }

  if (dbConfig.type === "mysql") {
    const [rows] = await (dbConnection as mysql.Connection).execute(
      sql,
      params
    );
    return rows;
  } else if (dbConfig.type === "sqlite") {
    return new Promise((resolve, reject) => {
      (dbConnection as sqlite3.Database).all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  } else {
    throw new Error("Unsupported database type for query execution.");
  }
}

// Function to run a DML (INSERT, UPDATE, DELETE) query for SQLite
// For MySQL, 'query' function can handle it.
export async function run(sql: string, params?: any[]): Promise<any> {
  if (!dbConnection) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }

  if (dbConfig.type === "sqlite") {
    return new Promise((resolve, reject) => {
      (dbConnection as sqlite3.Database).run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  } else if (dbConfig.type === "mysql") {
    // For MySQL, execute is fine for INSERT/UPDATE/DELETE
    const [result] = await (dbConnection as mysql.Connection).execute(
      sql,
      params
    );
    return result;
  } else {
    throw new Error("Unsupported database type for run execution.");
  }
}

// --- Table Creation and Seeding Logic ---

// --- Refresh Tokens Table Creation ---
async function createRefreshTokensTableMySQL() {
  const sql = await readFile(
    __dirname + '/data/sql/refresh_tokens_table.mysql.sql',
    'utf-8'
  );
  await query(sql);
  console.log("MySQL 'refresh_tokens' table ensured.");
}

async function createRefreshTokensTableSQLite() {
  const sql = await readFile(
    __dirname + '/data/sql/refresh_tokens_table.sqlite.sql',
    'utf-8'
  );
  await query(sql);
  console.log("SQLite 'refresh_tokens' table ensured.");
}

// --- Refresh Token Operations ---

export async function insertRefreshToken(userId: number, token: string, expiresAt: string, userAgent?: string) {
  const sql = `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent) VALUES (?, ?, ?, ?)`;
  return await run(sql, [userId, token, expiresAt, userAgent || null]);
}

export async function findRefreshToken(token: string) {
  const sql = `SELECT * FROM refresh_tokens WHERE token = ?`;
  const rows = await query(sql, [token]);
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function revokeRefreshToken(token: string) {
  const sql = `UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`;
  return await run(sql, [token]);
}

export async function revokeAllRefreshTokensForUser(userId: number) {
  const sql = `UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`;
  return await run(sql, [userId]);
}

export async function updateRefreshTokenExpiry(token: string, newExpiry: string) {
  const sql = `UPDATE refresh_tokens SET expires_at = ? WHERE token = ?`;
  return await run(sql, [newExpiry, token]);
}

// Decks Table Creation
async function createDecksTableMySQL() {
  const sql = await readFile(
    __dirname + '/data/sql/decks_table.mysql.sql',
    'utf-8'
  );
  await query(sql);
  console.log("MySQL 'decks' table ensured.");
}

async function createDecksTableSQLite() {
  const sql = await readFile(
    __dirname + '/data/sql/decks_table.sqlite.sql',
    'utf-8'
  );
  await query(sql);
  console.log("SQLite 'decks' table ensured.");
}

async function createUserCardsTableMySQL() {
  const sql = await readFile(
    __dirname + '/data/sql/user_cards_table.mysql.sql',
    'utf-8'
  );
  await query(sql);
  console.log("MySQL 'user_cards' table ensured.");
}

async function createUserCardsTableSQLite() {
  const sql = await readFile(
    __dirname + '/data/sql/user_cards_table.sqlite.sql',
    'utf-8'
  );
  await run(sql);
  console.log("SQLite 'user_cards' table ensured.");
}


async function createUsersTableMySQL() {
  const sql = await readFile(
    __dirname + '/data/sql/users_table.mysql.sql',
    'utf-8'
  );
  await query(sql);
  console.log("MySQL 'users' table ensured.");
}

async function createUsersTableSQLite() {
  const sql = await readFile(
    __dirname + '/data/sql/users_table.sqlite.sql',
    'utf-8'
  );
  await run(sql);
  console.log("SQLite 'users' table ensured.");
}


async function seedInitialUsers() {
  const username = "admin";
  const password = "admin_password"; // Default password
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await query(`SELECT * FROM users WHERE username = ?`, [
    username,
  ]);

  if (!existingUser || existingUser.length === 0) {
    if (dbConfig.type === "mysql") {
      await run(
        `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`,
        [username, hashedPassword, true]
      );
    } else if (dbConfig.type === "sqlite") {
      await run(
        `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`,
        [username, hashedPassword, 1]
      ); // SQLite uses 0/1 for BOOLEAN
    }
    console.log("Seeding: Default 'admin' user created.");
  }
}
