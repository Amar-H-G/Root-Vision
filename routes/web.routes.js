const router = require("express").Router();
const mapController = require("../controllers/map.controller");

router.get("/", mapController.home);

module.exports = router;
