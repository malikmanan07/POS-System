const jwt = require("jsonwebtoken");

exports.requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "No token provided" });
    if (!process.env.JWT_SECRET)
      return res.status(500).json({ error: "JWT_SECRET not set in .env" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
};