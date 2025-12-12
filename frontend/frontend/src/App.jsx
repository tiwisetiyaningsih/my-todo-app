import { useEffect, useState } from "react";

const BACKEND_BASE = (() => {
  // during local dev call local backend
  if (import.meta.env.DEV) return "http://localhost:3000/api"; // if you use vercel dev or proxy map; you may change
  // in production, set the backend url here or use env var
  return import.meta.env.VITE_BACKEND_URL || "/api";
})();

function authFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${BACKEND_BASE}${path}`, { ...opts, headers }).then(async (r) => {
    const json = await r.json().catch(()=>null);
    if (!r.ok) throw json || { error: "Request failed" };
    return json;
  });
}

export default function App() {
  const [mode, setMode] = useState("auth"); // auth | app
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setMode("app");
      loadTodos();
    }
  }, []);

  async function register() {
    try {
      await authFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      alert("Registered. Now login.");
    } catch (e) {
      alert(e.error || "Error");
      console.error(e);
    }
  }

  async function login() {
    try {
      const res = await authFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem("token", res.token);
      setMode("app");
      loadTodos();
    } catch (e) {
      alert(e.error || "Login failed");
      console.error(e);
    }
  }

  async function logout() {
    localStorage.removeItem("token");
    setMode("auth");
    setTodos([]);
  }

  async function loadTodos() {
    try {
      const data = await authFetch("/todos");
      setTodos(data);
    } catch (e) {
      console.error(e);
      alert(e.error || "Failed to load");
    }
  }

  async function addTodo() {
    if (!text.trim()) return;
    try {
      await authFetch("/todos/create", {
        method: "POST",
        body: JSON.stringify({ text, priority, deadline: deadline || null })
      });
      setText(""); setDeadline(""); setPriority("medium");
      loadTodos();
    } catch (e) {
      alert(e.error || "Create failed");
    }
  }

  async function toggleTodo(id) {
    try {
      await authFetch(`/todos/update?id=${id}`, {
        method: "PUT",
        body: JSON.stringify({})
      });
      loadTodos();
    } catch (e) { console.error(e) }
  }

  async function deleteTodo(id) {
    if (!confirm("Delete?")) return;
    try {
      await authFetch(`/todos/delete?id=${id}`, { method: "DELETE" });
      loadTodos();
    } catch (e) { console.error(e) }
  }

  if (mode === "auth") {
    return (
      <div className="container app-card">
        <div className="card p-4 fade-in">
          <h3 className="mb-3">My ToDo — Auth</h3>

          <input className="form-control my-2" placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input className="form-control my-2" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />

          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={login}>Login</button>
            <button className="btn btn-outline-secondary" onClick={register}>Register</button>
          </div>

          <p className="text-muted small mt-3">Use register then login. Backend must be deployed and env vars set.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container app-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>My ToDo</h3>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={loadTodos}>Refresh</button>
          <button className="btn btn-sm btn-danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="card p-3 mb-3 fade-in">
        <div className="row g-2">
          <div className="col-12">
            <input className="form-control" placeholder="Task" value={text} onChange={e=>setText(e.target.value)} />
          </div>
          <div className="col-6">
            <select className="form-select" value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-6">
            <input className="form-control" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          </div>
          <div className="col-12">
            <button className="btn btn-primary w-100" onClick={addTodo}>Add</button>
          </div>
        </div>
      </div>

      <div>
        {todos.length === 0 && <p className="text-muted">No todos yet</p>}
        {todos.map(t => (
          <div key={t.id} className={`card p-2 mb-2 todo-item ${t.completed ? "completed" : ""}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div><strong>{t.text}</strong></div>
                <div className="small text-muted">Priority: {t.priority} • Deadline: {t.deadline || "-"}</div>
              </div>
              <div>
                <button className="btn btn-success btn-sm me-2" onClick={()=>toggleTodo(t.id)}>✓</button>
                <button className="btn btn-danger btn-sm" onClick={()=>deleteTodo(t.id)}>✗</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
