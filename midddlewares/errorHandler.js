module.exports = (err, req, res, next) => {
  console.error("Error:", err);
  const status = err.status || 500;
  const msg = err.message || "Internal Server Error";
  if (req.accepts("json"))
    return res.status(status).json({ ok: false, error: msg });
  res.status(status).send(msg);
};
