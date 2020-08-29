const express = require('express');
const query = require('../lib/query');

const router = express.Router();



router.get('/email/isduplicated', (req, res, next) => {
    let email = req.query.email;

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

router.get('/nick/isduplicated', (req, res, next) => {
    let nick = req.query.nick;

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

router.get('/route/:routeNumber/postlist', (req, res, next) => {
    let routeId = req.params.routeNumber;
    let date = req.query.date;
    
    let returns = [];

    query.get_post_list(routeId, date, (err, result) => {
        result.forEach(post => {
            let data = {
                post_no: post.post_no,
                route_no: post.route_no,
                owner_user_name: post.owner_user_name,
                reservation_time: post.reservation_time,
                attender_num: post.attender_num,
                create_time: post.create_time
            }
            returns.push(data);
        });
        res.json(returns);
    });
});

module.exports = router;