import express from "express";
import UserModel from "../models/User";
export const updateLastSeen = async (
  req: express.Request,
  _: express.Response,
  next: express.NextFunction
) => {

  if (req.user) {
    console.log(req.user);

    await UserModel.findOneAndUpdate(
      { _id: req.user },
      {
        last_seen: new Date(),
      },
      { new: true }
    );

    
  }
  next();
};
