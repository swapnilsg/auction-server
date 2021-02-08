const express = require("express");
const users = require("./users/users");
const auction = require("./auction/auction");
const bodyParser = require("body-parser");
const cors = require("cors");

//setting db ...
const {
  initDB,
  setPromiseLibrary
} = require("lokijs-promise");
setPromiseLibrary(global.Promise);

initDB("auction.json", 1000);

const app = express();
const port = 9000;

app.use(cors());
app.use(bodyParser.json());

app.use("/users", users);
app.use("/auction", auction);

process.on("uncaughtException", error => {
  console.log("uncaught error occured", error);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
