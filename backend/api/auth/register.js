import { getDB } from "../../../lib/db.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username & password required" });

    const db = getDB();

    // check existing
    const [exists] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (exists.length) return res.status(400).json({ error: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);

    await db.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hash]);
    return res.json({ message: "User registered" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
