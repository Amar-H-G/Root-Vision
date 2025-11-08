module.exports = (req, res, next) => {
  if (req.accepts("json"))
    return res.status(404).json({ ok: false, error: "Not found" });
  res.status(404).send("Not found");
};
