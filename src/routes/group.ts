import { Router } from "express";
import { authMiddleWare } from "middleware";
import { Group, User } from "models";

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
  const groups = await Group.find({ members: memberId });
  res.send(groups);
});

router.get("/:groupId", authMiddleWare, async (req, res) => {
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId)
    .populate("members", {
      password: 0,
    })
    .lean({ virtuals: true });
  res.send(group);
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
    res.send(group);
  }
);

router.post("/:groupId/member/:memberId", authMiddleWare, async (req, res) => {
  console.log("Called");
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
  await group.save();
//   console.log("Called", group);
  res.send(group);
});

export default router;
