import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];//BEARER TOKEN

  if (!token) return res.status(401).json({ message: "Access token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user; // attach decoded payload
    next();
  });
}
export function isAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({ message: "Unauthorized - Admins only" });
  }
}

//Get Token
//curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"username\":\"piyush\",\"isAdmin\":true}"

//Access profile
//curl http://localhost:3000/profile -H "Authorization: Bearer <your_token_here>"

//access admin dashboard
//curl http://localhost:3000/admin-dashboard -H "Authorization: Bearer <your_token_here>"

