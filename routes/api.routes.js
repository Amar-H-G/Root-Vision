const router = require("express").Router();
const tracking = require("../controllers/tracking.controller");

// sessions
router.post("/session", tracking.createSession); // start a new session
router.get("/session/:id", tracking.getSession); // fetch a session meta
router.post("/session/:id/end", tracking.endSession); // end a session

// location batches
router.post("/track", tracking.postBatchPoints); // save batched points
router.get("/track/:sessionId", tracking.getPoints); // list points for session

module.exports = router;
