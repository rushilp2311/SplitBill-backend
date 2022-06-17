import { Router } from "express";
import { authMiddleWare } from "middleware";
import { Expense, Group, User } from "models";
import { calculateSplit } from "services";
import { updateMemberBalances } from "services/expenseService";

const router = Router();

router.post("/", authMiddleWare, async (req, res) => {
  const group = new Group({
    name: req.body.name,
    description: req.body.description,
    members: req.body.members,
  });
  await group.save();

  res.send(group);
});

router.get("/member/:memberId", authMiddleWare, async (req, res) => {
  const memberId = req.params.memberId;
  let groups = await Group.find({ members: memberId }).lean();
  groups = groups.map(async (group) => {
    const totalExpenses = await Expense.countDocuments({ group: group._id });
    return {
      ...group,
      totalExpenses,
    };
  });
  groups = await Promise.all(groups);
  res.send(groups);
});

router.get("/:groupId", authMiddleWare, async (req, res) => {
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId)
    .populate("members", {
      password: 0,
    })
    .lean({ virtuals: true });
  const totalExpenses = await Expense.countDocuments({ group: group._id });
  res.send({ ...group, totalExpenses });
});

router.delete(
  "/:groupId/member/:memberId",
  authMiddleWare,
  async (req, res) => {
    const groupId = req.params.groupId;
    const memberId = req.params.memberId;
    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).send("Group not found");
    }
    const index = group.members.indexOf(memberId);
    if (index > -1) {
      group.members.splice(index, 1);
      await group.save();
    }

    const expenses = await Expense.find({ group: groupId });

    const updatedMemberBalances = await updateMemberBalances(
      expenses,
      group.members
    );

    await Promise.all(
      updatedMemberBalances.map(async (memberBalances) => {
        await Expense.updateOne(
          { _id: memberBalances.expenseId },
          { $set: { membersBalance: memberBalances.membersBalance } }
        );
      })
    );
    res.send(group);
  }
);

router.post("/:groupId/member/:memberId", authMiddleWare, async (req, res) => {
  const groupId = req.params.groupId;
  const memberId = req.params.memberId;
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404).send("Group not found");
  }
  const member = await User.findById(memberId);
  if (!member) {
    res.status(404).send("Member not found");
  }
  group.members.push(memberId);

  const expenses = await Expense.find({ group: groupId });

  const updatedMemberBalances = await updateMemberBalances(
    expenses,
    group.members
  );

  await Promise.all(
    updatedMemberBalances.map(async (memberBalances) => {
      await Expense.updateOne(
        { _id: memberBalances.expenseId },
        { $set: { membersBalance: memberBalances.membersBalance } }
      );
    })
  );

  await group.save();
  res.send(group);
});

export default router;
