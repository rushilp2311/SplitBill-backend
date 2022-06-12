import { Router } from "express";
import { authMiddleWare } from "middleware";
import { Group } from "models";

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

export default router;
