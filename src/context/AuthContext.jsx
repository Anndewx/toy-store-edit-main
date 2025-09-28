import { createContext, useContext, useEffect, useState } from "react";
import { post } from "../lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
  }, []);

  function setSession(t, u) {
    if (t) localStorage.setItem("token", t);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  // ★ รับ usernameOrEmail → แปลงเป็น {username} หรือ {email}
  async function login({ usernameOrEmail, password }) {
    const body =
      usernameOrEmail?.includes("@")
        ? { email: usernameOrEmail, password }
        : { username: usernameOrEmail, password };
    const data = await post("/auth/login", body); // {ok, user, token}
    if (!data.ok) throw new Error(data.error || "Login failed");
    setSession(data.token, data.user);
    return data;
  }

  async function register({ name, email, password }) {
    const data = await post("/auth/register", { name, email, password });
    if (!data.ok) throw new Error(data.error || "Register failed");
    setSession(data.token, data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
