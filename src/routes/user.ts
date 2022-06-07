import bcrypt from "bcrypt";
import { Request, Router } from "express";
import _ from "lodash";
import auth from "middleware/auth";
import { User, validate } from "models";
import { UserType } from "types";

const router = Router();

router.get("/me", auth, async (req: Request & { user: UserType }, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.team = 0;
  await user.save();
  const token = user.generateAuthToken();
  res
    .header("Authorization", token)
    .header("access-control-expose-headers", "Authorization")
    .send(_.pick(user, ["_id", "name", "email"]));
});

export default router;
