import { getDB } from "../../../lib/db.js";
import { verifyToken } from "../../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const auth = verifyToken(req);
  if (!auth) return res.status(403).json({ error: "Unauthorized" });

  try {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });

    const db = getDB();
    await db.query("DELETE FROM todos WHERE id = ? AND user_id = ?", [id, auth.id]);
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
