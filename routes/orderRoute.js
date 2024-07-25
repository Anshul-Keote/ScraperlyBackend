const express = require("express");
const { createOrder,startOrder, generateCSV  } = require("../controllers/orderController");

const router = express.Router();

router.route("/createOrder").post(createOrder);
router.route("/startOrder").post(startOrder);
router.route("/generateCSV").post(generateCSV);

module.exports = router