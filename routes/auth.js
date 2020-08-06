/* Library */
const express = require('express');
const query = require('../lib/query');

const router = express.Router();

/* Middle Ware */
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');

router.get('/login', (req, res, next) => {
    var fmsg = req.flash(); //플래시 메세지
    var feedback = '';
    if(fmsg.error) {
        feedback = fmsg.error;
    }
    res.render('login', {flashMsg: feedback});
});

router.get('/register', (req, res, next) => {
    var fmsg = req.flash(); //플래시 메세지
    var feedback = '';
    if(fmsg.error) {
        feedback = fmsg.error;
    }

    res.render('register', {flashMsg: feedback});
});

router.post('/register/process', (req, res, next) => {
    let email = req.body.email;
    let password = req.body.password;
    let phone = req.body.phone;
    let userType = req.body.user_type;
    let nick = req.body.nick;

    if(!email) {
        req.flash('error', "이메일을 입력하십시오.");
        res.redirect("/auth/register");
    }
    else if (!password) {
        req.flash('error', "비밀번호를 입력하십시오.");
        res.redirect("/auth/register");
    }
    else if(!phone) {
        req.flash('error', "전화번호를 입력하십시오.");
        res.redirect("/auth/register");
    }
    else if(!userType) {
        req.flash('error', "유저 구분을 선택하십시오.");
        res.redirect("/auth/register");
    }
    else if(!nick) {
        req.flash('error', "닉네임을 입력하십시오.");
        res.redirect("/auth/register");
    }
    else {
        query.register(email, password, phone, userType, nick, (err, result) => {
            if(err.code === "ER_DUP_ENTRY") {
                req.flash('error', "같은 이메일이 존재합니다.");
                res.redirect('/auth/register');
            }
            else if (err) {
                req.flash('error', "Register Error : Server Error.");
                res.redirect('/auth/register');
            }
            else if(result) {
                res.redirect('/auth/login');
            }
            else {
                req.flash('error', "Register Error : Unknown Error.");
                res.redirect('/auth/register');
            }
        });
    }
})

router.get('/logout', (req, res, next) => {
    //delete req.user;
    req.logout(); //로그아웃
    req.session.destroy((err) => { //세션 제거
        res.redirect('/auth/login');
    });
});


/* login processes */
passport.serializeUser((userId, done) => {
    done(null, userId);
});

passport.deserializeUser((id, done) => {
    done(null, id);
});

router.post('/login/process',
    passport.authenticate('local' ,{
        successRedirect : '/',
        failureRedirect : '/auth/login',
        failureFlash    : true,
        badRequestMessage: '아이디 또는 비밀번호를 입력하십시오.'
    })
);

passport.use(new LocalStrategy(
    {
        usernameField : 'user_email',
        passwordField : 'user_pw'
    },
    function(email, password, done) {
        //로그인 프로세스
        query.login_check(email, password, (result) => {
            if (result) {
                return done(null, result);
            }
            else if (result === false) {
                return done(null, false, { message : '아이디 또는 비밀번호가 틀렸습니다.'});
            }
            else {
                return done(null, false, { message : "Login Error : Server Error."});
            }
        });

    }
));

module.exports = router;