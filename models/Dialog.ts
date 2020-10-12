import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";

interface IMessageDialog {
  read?: boolean;
  _id?: string;
  dialog?: IDialog | string;
  text?: string;
}
export interface IDialog extends Document {
  partner: IUser | string;
  author: IUser | string;
  lastMessage: IMessageDialog;
  newMessage: Date;
  countUnreadMessages: number
}

const DialogSchema = new Schema(
  {
    partner: { type: Schema.Types.ObjectId, ref: "User" },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    newMessage: { type: Date },
    lastMessage: {
      _id: { type: String },
      text: { type: String },
      dialog: { type: Schema.Types.ObjectId },
      read: { type: Boolean, default: false  },
    },
    countUnreadMessages: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

const DialogModel = mongoose.model<IDialog>("Dialog", DialogSchema);

export default DialogModel;
