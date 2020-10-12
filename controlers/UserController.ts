import { createJWToken } from "./../utils/createJWToken";
import { IUser } from "./../models/User";
import socket from "socket.io";
import express from "express";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import UserModel from "../models/User";

class UserControler {
  io: socket.Server;

  constructor(io: socket.Server) {
    this.io = io;
  }

  getMe = (req: express.Request, res: express.Response) => {
    console.log(req.user);
    console.log(res);

    const id: string | undefined = req.user && req.user;

    UserModel.findById(id, (err: any, user: IUser) => {
      if (err || !user) {
        return res.status(404).json({
          message: "Not found",
        });
      }
      res.json(user);
    });
  };
  delete = (req: express.Request, res: express.Response) => {
    const id: string = req.params.id;

    UserModel.findOneAndRemove({ _id: id })
      .then((user: IUser | null) => {
        user
          ? res.json({ message: `User ${user.fullname} deleted` })
          : res.status(404).json({ message: "Пользователь не найден" });
      })
      .catch((err: any) => {
        res.json({ message: err });
      });

    // const id: string = req.params.id;
  };
  create = async (req: express.Request, res: express.Response) => {
    const { email, fullname, password } = req.body;

    const errors = validationResult(req);
    const candidate = await UserModel.findOne({ email });

    if (candidate) {
      return res
        .status(400)
        .json({ message: "Такаой Пользователь уже создан" });
    } else if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new UserModel({ email, fullname, password: hashedPassword });

      user.save();

      res.json({ message: "Пользователь создан" });
    }
  };
  findUsers = (req: express.Request, res: express.Response): void => {
    const query: string =
      req.query && req.query.query ? (req.query as any).query : "";

    UserModel.find()
      .or([
        { fullname: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
      ])
      .then((users: IUser[]) => res.json(users))
      .catch((err: any) => {
        return res.status(404).json({
          status: "error",
          message: err,
        });
      });
  };
  login = (req: express.Request, res: express.Response): void => {
    const postData: { email: string; password: string } = {
      email: req.body.email,
      password: req.body.password,
    };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      UserModel.findOne({ email: postData.email }, (err: any, user: IUser) => {
        if (err || !user) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        if (bcrypt.compareSync(postData.password, user.password)) {
          const token = createJWToken(user.id);
          res.json({
            status: "success",
            _id: user.id,
            token,
          });
        } else {
          res.status(403).json({
            status: "error",
            message: "Incorrect password or email",
          });
        }
      });
    }
  };
}

export default UserControler;
