const Session = require("../models/Session");
const Location = require("../models/Location");

exports.createSession = async (req, res, next) => {
  try {
    const { userId, meta } = req.body || {};
    const session = await Session.create({
      userId: userId || null,
      meta: meta || {},
      startedAt: new Date(),
    });
    res.status(201).json({ ok: true, session });
  } catch (err) {
    next(err);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session)
      return res.status(404).json({ ok: false, error: "Session not found" });
    res.json({ ok: true, session });
  } catch (err) {
    next(err);
  }
};

exports.endSession = async (req, res, next) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: { endedAt: new Date() } },
      { new: true }
    );
    if (!session)
      return res.status(404).json({ ok: false, error: "Session not found" });
    res.json({ ok: true, session });
  } catch (err) {
    next(err);
  }
};

// Accept batch points: { sessionId, points: [{lat,lng,accuracy,timestamp}] }
exports.postBatchPoints = async (req, res, next) => {
  try {
    const { sessionId, points = [], userId } = req.body || {};
    if (!sessionId)
      return res.status(400).json({ ok: false, error: "sessionId required" });

    const sessionExists = await Session.exists({ _id: sessionId });
    if (!sessionExists)
      return res.status(404).json({ ok: false, error: "Session not found" });

    // sanitize & map to docs
    const docs = points
      .filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number")
      .map((p) => ({
        sessionId,
        userId: userId || null,
        point: { type: "Point", coordinates: [p.lng, p.lat] },
        accuracy: typeof p.accuracy === "number" ? p.accuracy : null,
        ts: p.timestamp ? new Date(p.timestamp) : new Date(),
      }));

    if (!docs.length)
      return res.status(400).json({ ok: false, error: "No valid points" });

    await Location.insertMany(docs, { ordered: false });
    res.status(201).json({ ok: true, inserted: docs.length });
  } catch (err) {
    next(err);
  }
};

exports.getPoints = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const points = await Location.find({ sessionId }).sort({ ts: 1 }).lean();
    res.json({ ok: true, points });
  } catch (err) {
    next(err);
  }
};
