import "reflect-metadata";
import { DataSource } from "typeorm";
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "db",
  port: 5432,
  username: "postgres",
  password: "1234",
  database: "musicapp",
  synchronize: true,
  logging: false,
  entities: [__dirname + "/entity/*.{js,ts}"],
  migrations: [],
  subscribers: [],
});
