import { Router } from "express";
import { authMiddleWare } from "middleware";
import { Expense, Group, User } from "models";
import { calculateSplit } from "services";

const router = Router();

router.post("/", authMiddleWare, async (req, res) => {
  const { groupId, paidBy, description, amount } = req.body;
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404).send("Group not found");
  }

  const members = await User.find(
    { _id: { $in: group.members } },
    { name: 1, _id: 1 }
  ).lean();

  const membersBalance = calculateSplit(paidBy, members, amount);

  const expense = new Expense({
    description,
    amount,
    date: Date.now(),
    group: groupId,
    paidBy,
    membersBalance,
    settledMembers: [],
  });

  await expense.save();
  res.send(expense);
});

router.get(
  "/group/:groupId/member/:memberId",
  authMiddleWare,
  async (req, res) => {
    const groupId = req.params.groupId;
    const memberId = req.params.memberId;
    const expenses = await Expense.find({
      group: groupId,
    }).populate("paidBy", {
      name: 1,
      _id: 1,
    });

    const activeExpenses = expenses.filter((expense) => {
      return (
        expense.settledMembers.indexOf(memberId) === -1 && !expense.isSettled
      );
    });

    const settledExpenses = expenses.filter((expense) => {
      return expense.settledMembers.indexOf(memberId) > -1 || expense.isSettled;
    });

    res.send({
      activeExpenses,
      settledExpenses,
    });
  }
);

router.post("/:expenseId/settle/:memberId", async (req, res) => {
  const expenseId = req.params.expenseId;
  const memberId = req.params.memberId;
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    res.status(404).send("Expense not found");
  }
  const index = expense.settledMembers.indexOf(memberId);
  if (index > -1) {
    expense.settledMembers.splice(index, 1);
  } else {
    expense.settledMembers.push(memberId);
  }
  if (
    expense.settledMembers.length ===
    expense.membersBalance.filter(
      (member) => member.memberId.toString() !== expense.paidBy.toString()
    ).length
  ) {
    expense.isSettled = true;
  }
  await expense.save();
  res.send(expense);
});

router.post("/:expenseId/revert/:memberId", async (req, res) => {
  const expenseId = req.params.expenseId;
  const memberId = req.params.memberId;
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    res.status(404).send("Expense not found");
  }
  const index = expense.settledMembers.indexOf(memberId);
  if (index > -1) {
    expense.settledMembers.splice(index, 1);
  }

  if (
    expense.settledMembers.length !==
    expense.membersBalance.filter(
      (member) => member.memberId.toString() !== expense.paidBy.toString()
    ).length
  ) {
    expense.isSettled = false;
  }
  await expense.save();
  res.send(expense);
});

export default router;
