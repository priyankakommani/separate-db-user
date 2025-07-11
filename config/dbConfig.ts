export const dbConfig = {
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME as string
}




