const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AuthRouter = require("./routes/AuthRouter");
const TestRouter = require("./routes/TestRouter");

dbConnect();

const allowedOrigin = 'http://localhost:3000';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());
app.use("/api/user", UserRouter);
app.use("/api/photosOfUser", PhotoRouter);
app.use("/api/admin", AuthRouter);
app.use("/api/test", TestRouter);

// Serve static images
app.use("/images", express.static("images"));

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
