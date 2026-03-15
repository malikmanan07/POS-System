const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
<<<<<<< HEAD
=======
const { requireAuth } = require("../middleware/auth");
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb

router.post("/login", auth.login);
router.post("/signup", auth.signup);

<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
=======
>>>>>>> Manan
module.exports = router;