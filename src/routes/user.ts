import bcrypt from "bcrypt";
import { Request, Router } from "express";
import _ from "lodash";
import { authMiddleWare } from "middleware";
import { Expense, User, validate } from "models";
import { UserType } from "types";

import mongoose from "mongoose";

const router = Router();

router.get(
  "/me",
  authMiddleWare,
  async (req: Request & { user: UserType }, res) => {
    const user = await User.findById(req.user._id).select("-password");
    res.send(user);
  }
);

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  const token = user.generateAuthToken();
  res
    .header("Authorization", token)
    .header("access-control-expose-headers", "Authorization")
    .send(_.pick(user, ["_id", "name", "email"]));
});

router.get("/:email", authMiddleWare, async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) return res.status(404).send("User not found.");
  delete user.password;
  res.send({
    name: user.name,
    email: user.email,
    id: user._id,
  });
});

router.get("/expenses/:userId", async (req, res) => {
  const { userId } = req.params;

  const paidByExpenses = await Expense.find({ paidBy: userId });
  const owedExpenses = await Expense.find({
    paidBy: { $ne: new mongoose.Types.ObjectId(userId) },
    $and: [
      {
        membersBalance: {
          $elemMatch: { memberId: new mongoose.Types.ObjectId(userId) },
        },
      },
      { settledMembers: { $ne: userId } },
    ],
  });

  const lent = paidByExpenses.reduce((previousValue, currentValue) => {
    if (currentValue.membersBalance.length < 1) return 0;
    let myBalance = currentValue.membersBalance.find(
      (member) => member.memberId.toString() === userId
    )?.balance;

    const settledExpenses =
      currentValue.settledMembers.length > 0
        ? currentValue.settledMembers.map((member) => {
            return currentValue.membersBalance.find(
              (memberBalance) => memberBalance.memberId.toString() === member
            )?.balance;
          })
        : [];

    myBalance =
      Number(myBalance) +
      settledExpenses?.reduce((previousValue, currentValue) => {
        return previousValue + Number(currentValue);
      }, 0);

    return previousValue + Number(myBalance);
  }, 0);

  const owe = owedExpenses.reduce((previousValue, currentValue) => {
    if (currentValue.membersBalance.length < 1) return 0;
    if (currentValue.settledMembers.includes(userId)) return 0;
    const myBalance = currentValue.membersBalance.find(
      (member) => member.memberId.toString() === userId
    )?.balance;
    return previousValue + Number(myBalance);
  }, 0);

  return res.send({ lent, owe });
});

router.get("/", async (req, res) => {
  const { userIds }: { userIds?: string } = req.query;

  const parsedUserIds = JSON.parse(userIds);

  if (!parsedUserIds || parsedUserIds.length < 1)
    return res.send([]);
  
  const result = await User.find(
    {
      _id: {
        $in: parsedUserIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    },
    { name: 1, _id: 1 }
  ).lean();
  return res.send(result);
});

export default router;
