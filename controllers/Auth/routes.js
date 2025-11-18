
const router = require("express").Router();
const { login } = require('../Auth/index')

router.post('/login',login)
 
module.exports = router