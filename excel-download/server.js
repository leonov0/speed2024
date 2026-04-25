import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import ExcelJS from "exceljs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_FILE = path.join(__dirname, "database.sql");
const DB_FILE = path.join(__dirname, "database.sqlite");

const app = express();

function normalizeMysqlDump(sql) {
  return sql
    .replace(/\/\*![\s\S]*?\*\//g, "")
    .replace(/LOCK TABLES[\s\S]*?;/g, "")
    .replace(/UNLOCK TABLES;/g, "")
    .replace(/ENGINE=\w+/g, "")
    .replace(/AUTO_INCREMENT=\d+/g, "")
    .replace(/DEFAULT CHARSET=\w+/g, "")
    .replace(/COLLATE=\w+/g, "")
    .replace(/bigint\(\d+\) unsigned/g, "INTEGER")
    .replace(/varchar\(\d+\)/g, "TEXT")
    .replace(/timestamp/g, "TEXT")
    .replace(/AUTO_INCREMENT/g, "AUTOINCREMENT")
    .replace(/`/g, "")
    .replace(/,\s*KEY [^(]+\([^)]+\)/g, "")
    .replace(/,\s*\)/g, ")");
}

const dbInit = new Database(DB_FILE);
dbInit.pragma("foreign_keys = ON");

const rawSql = fs.readFileSync(SQL_FILE, "utf8");
const sql = normalizeMysqlDump(rawSql);

dbInit.exec(sql);
dbInit.close();

const db = new Database(DB_FILE, { readonly: true });

app.get("/", async (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT p.id, p.title, COUNT(c.id) AS comment_count
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      GROUP BY p.id, p.title
      ORDER BY p.id ASC
    `
    )
    .all();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Posts");

  worksheet.columns = [
    { header: "id", key: "id" },
    { header: "title", key: "title" },
    { header: "comment count", key: "comment_count" },
  ];

  rows.forEach(row => worksheet.addRow(row));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="posts.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});