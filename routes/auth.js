/* Library */
const express = require('express');

const query = require('../lib/query');
const email_query = require('../lib/email-query');

const mailing = require('../mailing/mailing');

const router = express.Router();

/* Middle Ware */
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');

router.get('/login', (req, res, next) => {
    let fmsg = req.flash(); //플래시 메세지
    let feedback = '';

    if(fmsg.error) {        //로그인 실패시 메세지
        feedback = fmsg.error;
    }
    else if(fmsg.message) { //회원가입후 리다이렉트될때 메세지
        feedback = fmsg.message;
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

    //데이터 무결성 체크
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
    //회원가입 가능
    else {
        query.register(email, password, phone, userType, nick, (err, userId) => {
            if(err.code === "ER_DUP_ENTRY") { //이메일 중복
                req.flash('error', "같은 이메일이 존재합니다.");
                res.redirect('/auth/register');
            }
            else if (err) { //query쪽 에러
                req.flash('error', "Register Error : Server Error.");
                res.redirect('/auth/register');
            }
            else if(userId) { //회원가입 성공
                mailing.send_register_mail(email, userId, nick); //메일 보내기
                req.flash('message', "인증 이메일을 귀하의 이메일로 보냈습니다. 인증 후 사용가능합니다.");
                res.redirect('/auth/login');
            }
            else { //알수없는 오류
                req.flash('error', "Register Error : Unknown Error.");
                res.redirect('/auth/register');
            }
        });
    }
});

router.get('/emailcheck/:encryptedStr', (req, res, next) => {
    let encryptedStr = req.params.encryptedStr;
    console.log(encryptedStr);
    email_query.search_email_verify(encryptedStr, (err, userId) => {
        if(userId) {
            email_query.delete_email_verify(userId, () => {}); //email_verify 삭제

            let user = new query.User(userId);
            user.activation(); //유저 activation

            req.flash('message', "계정이 활성화 되었습니다.");
            res.redirect('/auth/login');
        }
        else {
            res.redirect('/');
        }
    });
});

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
            else if (result === false) { //아이디 또는 비밀번호 틀림
                return done(null, false, { message : '아이디 또는 비밀번호가 틀렸습니다.'});
            }
            else if (result === undefined) { //활성화 상태가 아님
                return done(null, false, { message : '계정이 비활성화 상태입니다.'});
            }
            else { //에러상태
                return done(null, false, { message : "Login Error : Server Error."});
            }
        });

    }
));

module.exports = router;