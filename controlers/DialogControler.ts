import express from "express";
import DialogModel from "../models/Dialog";
import MessageModel from "../models/Messages";
import socket from "socket.io";

class DialogControler {
  io: socket.Server;

  constructor(io: socket.Server) {
    this.io = io;
  }

  index = async (
    req: express.Request,
    res: express.Response
  ): Promise<void> => {
    const userId = req.user;

    DialogModel.find()
      .or([{ author: userId }, { partner: userId }])
      .populate(["author", "partner"])
      .populate({
        path: "user",
      })
      .exec(function (err, dialogs) {
        if (err) {
          return res.status(404).json({
            message: "Dialogs not found",
          });
        }
        return res.json(dialogs);
      });
  };

  create = (req: express.Request, res: express.Response): void => {
    const postData = {
      author: req.user,
      partner: req.body.partner,
      lastMessage: {
        text: req.body.text,
      },
      countUnreadMessages: 1,
    };

    DialogModel.findOne(
      {
        author: req.user,
        partner: req.body.partner,
      },
      (err, dialog) => {
        if (err) {
          return res.status(500).json({
            status: "error",
            message: err,
          });
        }
        if (dialog) {
          return res.status(403).json({
            status: "error",
            message: "Такой диалог уже есть",
          });
        } else {
          const dialog = new DialogModel(postData);

          dialog.save().then((dialogObj) => {
            const message = new MessageModel({
              text: req.body.text,
              user: req.user,
              dialog: dialogObj._id,
            });
            message
              .save()
              .then(() => {
                dialogObj.lastMessage = message;
                dialogObj.lastMessage._id = req.user;
                console.log(dialogObj);

                dialogObj.save().then(() => {
                  this.io.emit("SERVER:DIALOG_CREATED", {
                    ...postData,
                    dialog: dialogObj,
                  });
                  res.json(dialogObj);
                });
              })
              .catch((reason: any) => {
                res.json(reason);
              });

            res.json({ message: "Диалог  создан" });
          });
        }
      }
    );
  };
  delete = (req: express.Request, res: express.Response): void => {
    const id: string = req.query && req.query.id ? (req.query as any).id : "";
    const userId = req.user;
    DialogModel.findOneAndRemove({ _id: id })
      .then((dialog) => {
        if (dialog) {
          MessageModel.deleteMany({ dialog: id, user: { _id: userId } }).catch(
            () => {
              res.json({
                message: `Message not found`,
              });
            }
          );
          res.json({
            message: `Dialog deleted`,
          });
        }
      })
      .catch(() => {
        res.json({
          message: `Dialog not found`,
        });
      });
  };
}

export default DialogControler;
