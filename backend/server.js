import express from "express";
import cors from "cors";
import indexRouter from "./route/index.route.js";

const app = express();
const PORT = 8000;

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  return res.send(`Your server is running at the port of ${PORT}`);
});
app.use("/api", indexRouter);

app.listen(PORT, () => {
  console.log(`System monitor backend running at http://localhost:${PORT}`);
});
