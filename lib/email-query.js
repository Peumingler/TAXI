const mysql = require('mysql');
const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const dbconfig = require('../config/database.json');


//이메일 인증 생성
exports.create_email_verify = function(userId, callback) {
    let db = mysql.createConnection(dbconfig); 
    db.connect();

    hasher({ password: userId }, (err, pass, salt, hash) => { //암호화 SHA256
        if (err) {
            console.error("email_query.js : hasher error.", err);
            callback(err, undefined);
            return;
        }

        //verify 데이터 생성
        let queryStr =
            `INSERT INTO email_verify(verify_str, user_no, create_time)
            VALUES('${hash}', ${userId}, now())`;
        
        db.query(queryStr, (_err) => {
            db.end();
            if(_err) {
                console.error("email_query.js : query error.", _err);
                callback(_err, undefined);
                return;
            }
            callback(false, hash);
        });
    });
}

//이메일 인증 확인
exports.verify_email = function(verifyStr, callback) {
    let db = mysql.createConnection(dbconfig); 
    db.connect();

    let queryStr = 
        `SELECT user_no FROM email_verify WHERE verify_str = ${verifyStr}`;

    db.query(queryStr, (err, result) => {
        if(err) {
            console.error("email_query.js : verify__email() query error.", err);
            callback(err, undefined);
            return;
        }
        let userId = result[0]['user_no'];

        if(userId) { //verify 데이터가 있는 경우
            //user 활성화
            queryStr = `UPDATE users SET active = true WHERE user_no = ${userId}`
            db.query(queryStr, (_err) => {
                if(_err) {
                    console.error("email_query.js : verify__email() query error.", _err);
                    callback(_err, undefined);
                    return;
                }
                //verify 데이터 삭제
                queryStr = `DELETE FROM email_verify WHERE user_no = ${userId}`;
                db.query(queryStr, (_err) => {
                    db.end();
                    if(_err) {
                        console.error("email_query.js : verify__email() query error.", _err);
                        callback(_err, undefined);
                        return;
                    }
                    callback(false, true);
                });
            });
        }
    });
}