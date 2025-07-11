import { defineConfig } from 'drizzle-kit';
import { dbConfig } from "./config/dbConfig";
import fs from 'fs';
console.log(dbConfig);
export default defineConfig({
  schema: "./src/schemas/*",
  dialect: 'postgresql',
  out: "./drizzle",
  dbCredentials: {
    host: dbConfig.host ,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    ssl: { 
        rejectUnauthorized: true,
        ca: fs.readFileSync('./ca.pem').toString()
    }
}
  }
)