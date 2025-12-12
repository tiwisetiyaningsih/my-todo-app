import { getDB } from "../../../lib/db.js";
import { verifyToken } from "../../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = verifyToken(req);
  if (!auth) return res.status(403).json({ error: "Unauthorized" });

  try {
    const db = getDB();
    const [rows] = await db.query("SELECT id, text, priority, completed, deadline, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC", [auth.id]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
