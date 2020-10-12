// import { validationResult } from 'express-validator';
import bodyParser from "body-parser";
import express from "express";
import validationRegister from "../utils/validation/registration";
import validationLogin from "../utils/validation/login";
import UserControler from "../controlers/UserController";
import DialogControler from "../controlers/DialogControler";
import MessageControler from "../controlers/MessagesControler";
import { checkAuth } from "../middlewares/checkAuth";
import socket from "socket.io";
import cors from "cors";
import { updateLastSeen } from "../middlewares/updateLastSeen";
// import UserModel, { IUser } from "../models/User";

const createRoutes = (app: express.Express, io: socket.Server) => {
  const UserControls = new UserControler(io);
  const DialogControls = new DialogControler(io);
  const MessageControls = new MessageControler(io);

  app.use(cors());
  app.use(checkAuth);
  app.use(updateLastSeen);
  app.use(bodyParser.json());

  // app.get("/", (_: express.Request, res: express.Response) => {

  //     res.send("Hello, World!");
  // });
  app.get("/user/me", UserControls.getMe);
  app.post("/user/signup", validationRegister, UserControls.create);
  app.post("/user/signin", validationLogin, UserControls.login);
  app.delete("/user/delete/:id", UserControls.delete);
  app.get("/user/find", UserControls.findUsers);

  app.post("/dialogs", DialogControls.create);
  app.delete("/dialogs", DialogControls.delete);
  app.get("/dialogs", DialogControls.index);

  app.get("/messages", MessageControls.index);
  app.post("/messages", MessageControls.create);
  app.delete("/messages", MessageControls.delete);
  app.post("/readed", MessageControls.readed);

  /*app.delete("/messages", MessageControls.delete);*/
};

export default createRoutes;
