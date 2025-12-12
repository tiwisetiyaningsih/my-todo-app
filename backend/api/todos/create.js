import { getDB } from "../../../lib/db.js";
import { verifyToken } from "../../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = verifyToken(req);
  if (!auth) return res.status(403).json({ error: "Unauthorized" });

  try {
    const { text, priority = "medium", deadline = null } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });

    const db = getDB();
    await db.query("INSERT INTO todos (user_id, text, priority, deadline) VALUES (?, ?, ?, ?)", [auth.id, text, priority, deadline]);
    return res.json({ message: "Created" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
