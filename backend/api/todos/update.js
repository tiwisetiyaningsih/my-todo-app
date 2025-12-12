import { getDB } from "../../../lib/db.js";
import { verifyToken } from "../../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const auth = verifyToken(req);
  if (!auth) return res.status(403).json({ error: "Unauthorized" });

  try {
    // expecting query param ?id=123  OR body.id
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });

    // optionally accept text, priority, deadline, completed
    const { text, priority, deadline, completed } = req.body;

    const db = getDB();

    // build dynamic update
    const fields = [];
    const values = [];

    if (text !== undefined) { fields.push("text = ?"); values.push(text); }
    if (priority !== undefined) { fields.push("priority = ?"); values.push(priority); }
    if (deadline !== undefined) { fields.push("deadline = ?"); values.push(deadline); }
    if (completed !== undefined) { fields.push("completed = ?"); values.push(completed ? 1 : 0); }

    if (fields.length === 0) {
      // fallback: toggle completed
      await db.query("UPDATE todos SET completed = NOT completed, updated_at = NOW() WHERE id = ? AND user_id = ?", [id, auth.id]);
      return res.json({ message: "Toggled" });
    }

    values.push(id, auth.id);
    const sql = `UPDATE todos SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ? AND user_id = ?`;
    await db.query(sql, values);
    return res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
