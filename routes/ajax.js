const express = require('express');
const query = require('../lib/query');

const router = express.Router();



router.post('/email/isduplicated', (req, res, next) => {
    let email = req.body.email;

    query.user_exist_check(email, (err, userId) => {
        let isExist;
        if(userId) {
            isExist = true;
        }
        else {
            isExist = false;
        }
        res.json({exist: isExist});
    });
});

router.post('/nick/isduplicated', (req, res, next) => {
    let nick = req.body.nick;

    query.nick_exist_check(nick, (err, nick) => {
        let isExist;
        if(nick) {
            isExist = true;
        }
        else {
            isExist = false;
        }
        res.json({exist: isExist});
    });
});

module.exports = router;