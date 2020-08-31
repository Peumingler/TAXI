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
        
        console.log(isExist);
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

router.put('/phone', (req, res, next) => {
    let user = req.user;
    let newPhone = req.body.phone;

    if(newPhone === "" || newPhone.length !== 11) { //번호 포맷 체크
        res.json({isChanged: false});
    }
    else if(user) { //로그인 되어 있어야만 수정가능
        user.set_phone(newPhone, (err, isChanged) => {
            res.json({isChanged: isChanged});
        });
    }
});

router.put('/nick', (req, res, next) => {
    let user = req.user;
    let newNick = req.body.nick;

    if(newNick === "") {
        res.json({isChanged: false});
    }
    else if(user) { //로그인 되어 있어야만 수정가능
        user.set_nick(newNick, (err, isChanged) => {
            res.json({isChanged: isChanged});
        });
    }
});

module.exports = router;