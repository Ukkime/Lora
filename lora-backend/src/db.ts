// src/db.ts
import mysql from "mysql2/promise"; // MySQL promise-based client
import sqlite3 from "sqlite3"; // SQLite client (callback-based by default)
import { dbConfig } from "./config/db-config"; // Import your DB configuration

import bcrypt from "bcrypt";

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

// Decks Table Creation
async function createDecksTableMySQL() {
  const sql = `CREATE TABLE IF NOT EXISTS decks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    cards_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`;
  await query(sql);
}

async function createDecksTableSQLite() {
  const sql = `CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cards_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`;
  await query(sql);
}

async function createUserCardsTableMySQL() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS user_cards (
      user_id INT NOT NULL,
      card_id VARCHAR(255) NOT NULL,
      PRIMARY KEY (user_id, card_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );
  `;
  await query(createTableSql);
  console.log("MySQL 'user_cards' table ensured.");
}

async function createUserCardsTableSQLite() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS user_cards (
      user_id INTEGER NOT NULL,
      card_id TEXT NOT NULL,
      PRIMARY KEY (user_id, card_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );
  `;
  await run(createTableSql);
  console.log("SQLite 'user_cards' table ensured.");
}


async function createUsersTableMySQL() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE,
        credits INT DEFAULT 100
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT DEFAULT 100; // Para añadir si ya existe
    `;
  await query(createTableSql);
  console.log("MySQL 'users' table ensured.");
}

async function createUsersTableSQLite() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isAdmin INTEGER DEFAULT 0,
        credits INTEGER DEFAULT 100
    );
    -- SQLite no soporta ALTER IF NOT EXISTS, así que intentamos añadir la columna y capturamos el error si ya existe
    PRAGMA foreign_keys=off;
    BEGIN TRANSACTION;
    ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 100;
    COMMIT;
    PRAGMA foreign_keys=on;
    `;
  await run(createTableSql); // Use run for DML in SQLite
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
