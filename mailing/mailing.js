const nodemailer = require('nodemailer');

const ejs = require('ejs');
<<<<<<< HEAD
const email_query = require('../lib/email-query');
=======
const query = require('../lib/email-query');
>>>>>>> 4eca2bbe1bf7dd9e7c9a103aa95b8a02978cf14f
const smtpconfig = require('../config/mail.json');

function send_mail(toAddress, title, html) {
    //Generate mail transfonder.
    let transporter = nodemailer.createTransport({
        host: smtpconfig.smtpServerURL,
        secure: true,
        auth: {
            user: smtpconfig.account,
            pass: smtpconfig.password
        }
    });

    let mailOptions = {
        from    : smtpconfig.fromAddress,
        to      : toAddress,
        subject : title,
        html    : html
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if(err) {
            console.log("mailing.js : send_mail() error.", err);
        }
        transporter.close();
    });
}

exports.send_register_mail = function(toAddress, userId, nick, callback) {
<<<<<<< HEAD
    email_query.create_email_verify(userId, (err, encryptedStr) => {
        if(encryptedStr) {
            //이메일 html 생성
            ejs.renderFile('views/register_mail.ejs', {nickname: nick, verifyStr: encryptedStr}, {}, (err, str) => {
=======
    query.create_email_verify(userId, (err, encryptedStr) => {
        if(encryptedStr) {
            //이메일 html 생성
            ejs.renderFile('views/mail_auth.ejs', {nickname: nick, verifyStr: encryptedStr}, {}, (err, str) => {
>>>>>>> 4eca2bbe1bf7dd9e7c9a103aa95b8a02978cf14f
                send_mail(toAddress, "가치타자 이메일 인증", str);
            });
        }
        else {
<<<<<<< HEAD
            console.error(err);
        }
    });
}

//TODO in development
exports.send_find_password_mail = function(toAddress, userId, callback) {
    email_query.create_email_verify(userId, (err, encryptedStr) => {
        if(encryptedStr) {
            ejs.renderFile('views/find_password_mail.ejs', {verifyStr: encryptedStr}, {}, (err, str) => {
                send_mail(toAddress, "가치타자 비밀번호 변경", str);
            });
        }
        else {
            console.error(err);
=======
            console.log(err);
>>>>>>> 4eca2bbe1bf7dd9e7c9a103aa95b8a02978cf14f
        }
    });
}