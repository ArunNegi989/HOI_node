// controllers/Users/routes.js
const router = require("express").Router();
const { getUserdata } = require("../Users/index");

router.get("/userdata", getUserdata);
