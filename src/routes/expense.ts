import { Router } from "express";
import { authMiddleWare } from "middleware";
import { Expense, Group, User } from "models";
import { calculateSplit } from "services";

const router = Router();

router.post("/", authMiddleWare, async (req, res) => {
  const { groupId, paidBy, description, amount } = req.body;
  const group = await Group.findById(groupId).populate("members", { name: 1 });
  if (!group) {
    res.status(404).send("Group not found");
  }

  const membersBalance = calculateSplit(paidBy, group.members, amount);

  const expense = new Expense({
    description,
    amount,
    date: Date.now(),
    group: groupId,
    paidBy,
    membersBalance,
  });

  await expense.save();
  res.send(expense);
});

router.get("/group/:groupId", authMiddleWare, async (req, res) => {
  const groupId = req.params.groupId;
  const expenses = await Expense.find({ group: groupId }).populate("paidBy", {
    name: 1,
    _id: 1,
  });
  res.send(expenses);
});

export default router;
