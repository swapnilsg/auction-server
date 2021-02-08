const express = require("express");
const router = express.Router();
const { v4: uuildv4 } = require("uuid");
const { getCollection } = require("lokijs-promise");

router.post("/signup", async (req, res) => {
  const user = await getCollection("users");
  const isPresent = user.find({ email: req.body.email });
  if (isPresent.length === 0) {
    const uuid = uuildv4();
    const newUser = Object.assign(req.body, { _id: uuid });
    const insert = user.insert(newUser);
    res.json({ message: "user register successful", user: insert });
  } else {
    console.log("user exists");
    res.status(400).json({ message: "user already exisits" });
  }
});

router.post("/login", async (req, res) => {
  const user = await getCollection("users");
  const email = req.body.email;
  const password = req.body.password;
  if (email === undefined || password === undefined) {
    res.status(400).json({ message: "Bad request" });
  } else {
    const [systemUser] = user.find({ email: email });
    console.log("login", systemUser);
    if (systemUser === undefined) {
      res.json({ message: "user doesnot exists" });
    } else if (systemUser.password !== req.body.password) {
      res.status(401).json({ message: "username / password is incorrect" });
    } else {
      res.json({ message: "login successful", user: systemUser });
    }
  }
});

module.exports = router;
