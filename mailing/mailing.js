const nodemailer = require('nodemailer');

const ejs = require('ejs');
const query = require('../lib/email-query');
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
    query.create_email_verify(userId, (err, encryptedStr) => {
        if(encryptedStr) {
            //이메일 html 생성
            ejs.renderFile('views/mail_auth.ejs', {nickname: nick, verifyStr: encryptedStr}, {}, (err, str) => {
                send_mail(toAddress, "가치타자 이메일 인증", str);
            });
        }
        else {
            console.log(err);
        }
    });
}