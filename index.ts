import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import createRoutes from "./core/route";
import mongoose from "mongoose";
import config from "config";
import createSocket from "./core/socket";

dotenv.config();

mongoose
  .connect(config.get("mongoUri"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));

const app = express();
const http = createServer(app);
const io = createSocket(http);

createRoutes(app, io);

const PORT: number = 5000;
// config.get('baseUrl')

http.listen(PORT, function () {
  console.log(`Server: http://localhost:${PORT}`);
});
