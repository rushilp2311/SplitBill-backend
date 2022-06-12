import Joi from "joi";
("joi");
import mongoose from "mongoose";
import { UserType } from "types";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  description: {
    type: String,
    maxlength: 512,
  },
  members: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
  },
});

const Group = mongoose.model("Group", groupSchema);

const validateGroup = (user: UserType) => {
  const schema = {
    name: Joi.string().min(1).max(50).required(),
  };
  return Joi.object(schema).validate(user);
};

export default Group;
export { validateGroup  };
