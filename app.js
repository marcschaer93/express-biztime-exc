/** BizTime express application. */

const express = require("express");
const compRoutes = require("./routes/company.route");
const invRoutes = require("./routes/invoice.route");

const app = express();
const ExpressError = require("./expressError");
const morgan = require("morgan");

app.use(morgan("tiny"));

app.use(express.json());

app.use("/companies", compRoutes);
app.use("/invoices", invRoutes);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message,
  });
});

module.exports = app;
