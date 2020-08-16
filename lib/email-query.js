const mysql = require('mysql');
const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const dbconfig = require('../config/database.json');
const query = require('./query');

//이메일 인증 생성
exports.create_email_verify = function(userId, callback) {
    let db = mysql.createConnection(dbconfig); 
    db.connect();

    //랜덤 문자열 생성
    let encryptStr = Math.random().toString(36).substr(2,11);
    
    //verify 데이터 생성
    let queryStr =
        `INSERT INTO email_verify(verify_str, user_no, create_time)
    VALUES('${encryptStr}', ${userId}, now())`;

    db.query(queryStr, (_err) => {
        db.end();
        if (_err) {
            console.error("email_query.js : query error.", _err);
            callback(_err, undefined);
            return;
        }
        callback(false, encryptStr);
    });
}

//이메일 인증 찾기
exports.search_email_verify = function(verifyStr, callback) {
    let db = mysql.createConnection(dbconfig); 
    db.connect();

    //email_verify 테이블 검색
    let queryStr = 
        `SELECT user_no FROM email_verify WHERE verify_str = '${verifyStr}'`;
    db.query(queryStr, (err, result) => {
        console.log(result);
        let userId = result[0]['user_no'];

        if(err) {
            console.error("email_query.js : serach_email_verify() query error.", err);
            callback(err, undefined);
            return;
        }
        else if(userId) { //Row가 존재할 경우
            callback(false, userId);
        }
        else {  //Row가 존재하지 않을 경우
            callback(false, false);
        }
    });
}

//이메일 인증 삭제
exports.delete_email_verify = function(userId, callback) {
    let db = mysql.createConnection(dbconfig); 
    db.connect();

    //데이터가 있을 경우
    if (userId) {

        //email_verify 데이터 삭제
        queryStr = `DELETE FROM email_verify WHERE user_no = ${userId}`;
        db.query(queryStr, (err) => {
            db.end();
            if (err) {
                console.error("email_query.js : delete_email_verify() query error.", _err);
                callback(_err, undefined);
                return;
            }
            callback(false, userId);
        });
    }
}