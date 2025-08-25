import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyToken, isAdmin } from "./authMiddleware.js";
dotenv.config();
const app = express();
app.use(express.json());
//login route for generating token
app.post("/login", (req, res) => {
  const { username, isAdmin } = req.body;

  const token = jwt.sign(
    { username, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  res.json({ token });
});
//Protected route
app.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Profile accessed", user: req.user });
});
//login route for Admin 
app.get("/admin-dashboard", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin", user: req.user });
});
const PORT = process.env.PORT || 3000; //in case env file disrupts
app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});
