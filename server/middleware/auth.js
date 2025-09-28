import jwt from "jsonwebtoken";

export const authRequired = (req, res, next) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "no token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "invalid token" });
  }
};

// ให้มีชื่อ requireAuth ด้วย (alias) เพื่อไฟล์อื่นที่ import requireAuth ใช้ได้
export const requireAuth = authRequired;
