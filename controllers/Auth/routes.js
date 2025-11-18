
const router = require("express").Router();
const {createUsers , loginUser} = require("../Auth/index")
// register
router.post("/register", createUsers);

// login
router.post("/login", loginUser);
 
module.exports = router