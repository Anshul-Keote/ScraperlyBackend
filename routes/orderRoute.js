const express = require("express");
const { createOrder,startOrder  } = require("../controllers/orderController");

const router = express.Router();

router.route("/createOrder").post(createOrder);
router.route("/startOrder").post(startOrder);

module.exports = router