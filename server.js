const express = require("express");
const path = require("path");
const { mongoConnect } = require("./db/db");
require("dotenv").config();

const webRoutes = require("./routes/web.routes");
const apiRoutes = require("./routes/api.routes");
const notFound = require("./midddlewares/notFound");
const errorHandler = require("./midddlewares/errorHandler");

const app = express();
const PORT = 4000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

mongoConnect();

// app.get("/", (req, res) => {
//   res.render("view");
// });

// --- Body parsers ---
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use("/", webRoutes); // EJS pages
app.use("/api", apiRoutes); // JSON APIs

// --- 404 + error ---
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server Started at http://localhost:${PORT}`);
});
