import express from "express";
import MessageModel, { IMessage } from "../models/Messages";
import DialogModel from "../models/Dialog";
import socket from "socket.io";

class MessageControler {
  io: socket.Server;

  constructor(io: socket.Server) {
    this.io = io;
  }

  updateReadStatus = (
    res: express.Response,
    userId: string,
    dialogId: string
  ): void => {
    MessageModel.updateMany(
      { dialog: dialogId, user: { $ne: userId } },
      { $set: { read: true } },
      (err: any): void => {
        if (err) {
          res.status(500).json({
            status: "error",
            message: err,
          });
        } else {
          DialogModel.findOneAndUpdate(
            { _id: dialogId, "lastMessage._id": { $ne: userId } },
            {
              countUnreadMessages: 0,
              "lastMessage.read": true,
            }
          ).catch((err) =>
            res.status(500).json({
              status: "error",
              message: err,
            })
          );

          this.io.emit("SERVER:MESSAGES_READED", {
            userId,
            dialogId,
          });
        }
      }
    );
  };
  readed = (req: express.Request, res: express.Response): void => {
    const dialogId: string =
      req.query && req.query.dialog ? (req.query as any).dialog : "";
    const userId: string = req.user;
    this.updateReadStatus(res, userId, dialogId);
    res.json({ message: "прочитано" });
  };

  index = (req: express.Request, res: express.Response): void => {
    const dialogId: string =
      req.query && req.query.dialog ? (req.query as any).dialog : "";
    const userId: string = req.user;
    this.updateReadStatus(res, userId, dialogId);

    MessageModel.find({ dialog: dialogId })
      .populate(["dialog", "user", "attachments"])
      .exec(function (err, messages) {
        if (err) {
          return res.status(404).json({
            status: "error",
            message: "Messages not found",
          });
        }
        res.json(messages);
      });
  };

  create = (req: express.Request, res: express.Response): void => {
    const postData = {
      text: req.body.text,
      dialog: req.body.dialog_id,
      user: req.user,
    };

    const message = new MessageModel(postData);
    const userId: string = req.user;

    this.updateReadStatus(res, userId, postData.dialog);
    message
      .save()
      .then((obj: IMessage) => {
        obj.populate("dialog user", async (err: any, message: IMessage) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: err,
            });
          }

          DialogModel.findOneAndUpdate(
            { _id: postData.dialog },
            {
              newMessage: new Date(),

              lastMessage: {
                _id: req.user,
                text: message.text,
                dialog: message.dialog,
                read: message.read,
              },
              $inc: { countUnreadMessages: 1 },
            },
            {
              new: true,
            },
            function (err) {
              if (err) {
                return res.status(500).json({
                  status: "error",
                  message: err,
                });
              }
            }
          );
          let unreadMessages = await MessageModel.find({
            dialog: postData.dialog,
            read: false,
          });

          res.json(message);
          this.io.emit("SERVER:NEW_MESSAGE", { message, unreadMessages });
        });
      })
      .catch((reason) => {
        res.json(reason);
      });
  };

  delete = async (
    req: express.Request,
    res: express.Response
  ): Promise<void> => {
    const idArray: Array<string> = req.body.idArray;
    const dialogId = req.body.dialogId;
    // const userId: string = req.user;

    for (let i = 0; i < idArray.length; i++) {
      const id = idArray[i];

      MessageModel.deleteOne({ _id: id }, (err: any) => {
        if (err) {
          return res.status(404).json({
            status: "error",
            message: err,
          });
        }
      });
    }

    let lastMessage: any = await MessageModel.find({
      dialog: dialogId,
    })
      .limit(1)
      .sort({ $natural: -1 });

    DialogModel.findOne({ _id: dialogId }, (err: any, dialog) => {
      if (err) {
        res.status(500).json({
          status: "error",
          message: err,
        });
      }

      if (!dialog) {
        return res.status(404).json({
          status: "not found",
          message: err,
        });
      }
      if (lastMessage[0]) {
        dialog.lastMessage.text = lastMessage[0].text;
        dialog.lastMessage.read = lastMessage[0].read;
        dialog.lastMessage._id = lastMessage[0].user._id;
      } else {
        dialog.lastMessage.text = '';
        dialog.lastMessage.read = false;
        dialog.lastMessage._id = '';
        dialog.countUnreadMessages = 0
      }

      dialog.save();
      return res.json({
        status: "success",
        message: "Message deleted",
      });
    });
  };
}

export default MessageControler;
