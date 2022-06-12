import express from "express";
import cors from "cors";
import "dotenv/config";
import startDB from "startup/db";
import { auth, user, group } from "routes";

(async () => await startDB())();
const app = express();
app.use(express.json());
app.use(cors());

if (!process.env.JWT_PRIVATE_KEY) {
  console.error("FATAL ERROR: JWT_PRIVATE_KEY is not defined.");
  process.exit(1);
}

app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/group", group);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}...`);
});

export default server;
