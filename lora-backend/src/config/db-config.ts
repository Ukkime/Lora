// src/config/db-config.ts
type DbType = "sqlite" | "mysql";

interface DbConfig {
  type: DbType;
  mysql?: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
  };
  sqlite?: {
    database: string;
  };
}

const DB_TYPE_ENV: string = process.env.DB_TYPE || "sqlite"; // Default to sqlite if not set

const dbConfig: DbConfig = {
  type: DB_TYPE_ENV as DbType,
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "password",
    database: process.env.MYSQL_DATABASE || "magic_game_db",
  },
  sqlite: {
    database: process.env.SQLITE_DATABASE || "database.sqlite", // File name for SQLite DB
  },
};

// Validate chosen DB type
if (dbConfig.type !== "sqlite" && dbConfig.type !== "mysql") {
  console.error(
    `ERROR: Invalid DB_TYPE in .env or config. Must be 'sqlite' or 'mysql'. Current: ${dbConfig.type}`
  );
  process.exit(1);
}

export { dbConfig };
