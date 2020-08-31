const mysql = require('mysql');
const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const dbconfig = require('../config/database.json');

/* 유저 클래스 */
exports.User = class User {
    constructor(userId) {
        this.userId = userId;
    }

    //유저 데이터를 가져옴
    get_userData(callback) {
        if(this.userId === undefined) {
            callback(false, undefined);
            return;
        }

        let db = mysql.createConnection(dbconfig); 
        db.connect();
    
        let queryStr =
            `SELECT * FROM users WHERE user_no = ?`;
        
        db.query(queryStr, [this.userId], (err, result) => {
            db.end();
            if(err) {
                callback(err, undefined);
                return;
            }
            if(result.length === 0) {
                callback(false, undefined);
                return;
            }
            callback(false, result[0]);
        });
    }

    //post 생성
    set_post(routeId, specificLoc, date, time, callback) {
        this.get_userData((err, userData) => {
            if(err) {
                console.error("User.set_post() : get_userData Error.", err);
                callback(err, false);
                return;
            }
            let ownerName = userData['username'];
    
            let convDatetime = date + " " + time + ":00"; // YYYY-MM-DD HH:MM:SS 형식
            
            //post 생성
            let db = mysql.createConnection(dbconfig); 
            db.connect();
            let queryStr = `
            INSERT INTO post (route_no, owner_user_no, owner_user_name, reservation_time, specific_loc, attender_num, create_time)
                VALUES(?, ?, ?, str_to_date(?, '%Y-%m-%d %H:%i:%s'), ?, 0, now())`;

            db.query(queryStr, [routeId, this.userId, ownerName, convDatetime, specificLoc], (_err, result) => {
                if(_err) {
                    console.error("User.set_post() : query Error.");
                    callback(_err, false);
                    return;
                }
    
                let queryStr =
                `SELECT LAST_INSERT_ID() as post_no`;
                //post 번호 및 소유자 이름 반환
                db.query(queryStr, (err, data) => {
                    db.end();
                    let result = {
                        postId: data[0]['post_no'],
                        ownerName: ownerName
                    }
                    callback(false, result);
                });
            });
        });
    }

    set_password(password, callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();
        generate_encrypted_password(password, (err, encryptedPassword, salt) => {
            let queryStr =
                `UPDATE users SET password = ?, password_salt = ? WHERE user_no = ?`;
            db.query(queryStr, [encryptedPassword, salt, this.userId], (err) => {
                db.end()
                if(err) {
                    console.error("query.js : User.set_password() query error.", err);
                    return callback(err, false);
                }
                callback(false, true);
            });
        });
    }

    set_phone(phone, callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();

        let queryStr =
            `UPDATE users SET phone = ? WHERE user_no = ?`;
        db.query(queryStr, [phone, this.userId], (err) => {
            db.end();
            if(err) {
                console.error("query.js : User.set_phone() query error.", err);
                return callback(err, false);
            }
            callback(false, true);
        });
    }

    set_nick(nick, callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();

        let queryStr =
            `UPDATE users SET username = ? WHERE user_no = ?`;

        db.query(queryStr, [nick, this.userId], (err) => {
            db.end();
            if (err) {
                if (err.code === "ER_DUP_ENTRY") { //Unique Key 중복 경우
                    return callback(false, false);
                }
                else {
                    console.error("query.js : User.set_nick() query error.", err);
                    return callback(err, false);
                }
            }
            callback(false, true);
        });
    }

    //유저 활성화
    activation() {
        let db = mysql.createConnection(dbconfig); 
        db.connect();

        //user 활성화
        let queryStr = `UPDATE users SET active = true WHERE user_no = ?`;
        db.query(queryStr, [this.userId], (err) => {
            db.end();
            if(err) {
                console.error("query.js : User.activation() query error.", err);
                return;
            }
        });
    }

    //유저 비활성화
    deactivation() {
        let db = mysql.createConnection(dbconfig); 
        db.connect();

        //user 활성화
        let queryStr = `UPDATE users SET active = false WHERE user_no = ?`
        db.query(queryStr, [this.userId], (err) => {
            db.end();
            if(err) {
                console.error("query.js : User.deactivation() query error.", err);
                return;
            }
        });
    }
}

/* post 클래스 */
exports.Post = class Post {
    constructor(postId) {
        this.postId = postId;
        get_route_id_from_post(postId, (err, result) => {
            if(!result) {
                this.routeId = undefined;
                return;
            }
            else {
                this.routeId = result;
            }
        });
    }

    get_data(callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();
    
        let queryStr =
        `SELECT
            post_no, route_no, owner_user_no, owner_user_name, date_format(reservation_time, '%Y-%m-%d %H시 %i분') as reservation_time, specific_loc, attend_taxi_no, attender_num
            FROM post 
            WHERE post_no = ?`;
    
        db.query(queryStr, [this.postId],(err, result) => {
            db.end();
            if(err) {
                console.error("Post.get_post_data() : query error.", err);
                callback(err, undefined);
                return;
            }
            if(result.length === 0) {
                callback(false, undefined);
                return;
            }
            callback(false, result[0]);
        });
    }

    delete(callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();
    
        //post_attender 데이터 제거
        let queryStr =
            `DELETE FROM post_attender WHERE post_no = ?`;
        db.query(queryStr, [this.postId], (err, result) => {
            if(err) {
                console.error("Post.delete() : post_attender query error.", err);
                callback(err, false);
                return;
            }
            //post 데이터 제거
            queryStr =
                `DELETE FROM post WHERE post_no = ?`;
            db.query(queryStr, [this.postId], (err, result) => {
                if(err) {
                    console.error("Post.delete() : query Error.", err);
                    callback(err, false);
                    return;
                }
                callback(false, true);
            });
        });
    }

    set_attender(attenderId, username, callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();
    
        //자리 남았나 확인을 위해 POST 데이터 가져오기
        this.get_data((err, postData) => {
            if(err || !postData) {
                callback(err, undefined);
                return;
            }
    
            let attenderNum = postData['attender_num'];
            if(attenderNum > 2) { //꽉찼나 확인
                callback(false, false);
                return;
            }
    
            //post의 attender_num 업데이트
            let queryStr =
                `UPDATE post SET attender_num = ? WHERE post_no = ?`;
            db.query(queryStr, [attenderNum + 1, this.postId], (err, result) => {
                if(err) {
                    console.error("Post.set_attender() : UPDATE query Error.", err);
                    callback(err, false);
                    return;
                }
    
                //post_attender 업데이트
                queryStr =
                    `INSERT INTO post_attender (post_no, attender_user_no, attender_user_name)
                        VALUES(?, ?, ?)`;
                
                db.query(queryStr, [this.postId, attenderId, username], (_err, _result) => {
                    db.end();
                    if(_err) {
                        console.error("Post.set_attender() : query Error.", _err);
                        callback(_err, false);
                        return;
                    }
                    callback(false, true);
                });
            });
        });
    }

    get_attender(callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();
    
        let queryStr =
            `SELECT attender_user_no, attender_user_name FROM post_attender WHERE post_no = ?`;
        db.query(queryStr, [this.postId], (err, list) => {
            db.end();
            if(err) {
                console.error("Post.get_attender() : query Error.", err);
                callback(err, undefined);
                return;
            }
            callback(false, list);
        });
    }

    del_attender(userId, callback) {
        let db = mysql.createConnection(dbconfig);
        db.connect();
    
        let queryStr =
            `DELETE FROM post_attender WHERE (post_no = ? and attender_user_no = ?)`;
    
        //post_attender 데이터 제거
        db.query(queryStr, [this.postId, userId], (err, result) => {
            if(err) {
                console.error("del_attender : query error.", err);
                callback(err, false);
                return;
            }
            
            //post attender_num 업데이트를 위해 참가자수 가져오기
            this.get_data((_err, postData) => {
                if(_err || !postData) {
                    console.error("!!! del_attender : get_post : DB broken. have to reset tables.");
                    callback(_err, false);
                    return;
                }
                let attenderNum = postData['attender_num'];
                
                //post attender_num 업데이트    
                queryStr =
                    `UPDATE post SET attender_num = ? WHERE post_no = ?`;
                db.query(queryStr, [attenderNum - 1, this.postId],(__err, __result) => {
                    if(__err) {
                        console.error("Post.del_attender() : UPDATE query error.");
                        callback(__err, false);
                        return;
                    }
                    callback(false, true);
                });
            });
        });
    }
}

function get_route_id_from_post(postId, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
        `SELECT route_no FROM post WHERE post_no = ?`;

    db.query(queryStr, [postId], (err, routeData) => {
        if (err) {
            console.error("get_route_id_from_post : query error.");
            callback(err, false);
            return;
        }
        callback(false, routeData[0]['route_no']);
    });
}

//SHA256 encryption
function generate_encrypted_password(password, callback) {
    hasher({ password: password }, (err, pass, salt, hash) => {
        if (err) {
            console.error("register : generate_encrypted_password error.", err);
            callback(err, undefined, undefined);
            return;
        }
        callback(err, hash, salt);
    });
}

exports.user_exist_check = function(email, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
        `SELECT user_no FROM users where email = ?`;
    
    db.query(queryStr, [email], (err, result) => {
        db.end();
        if (err) {
            console.error("query.js : user_exist_check() query error.", err);
            callback(err, undefined);
            return;
        }

        //계정이 없을 경우
        if (result.length === 0) {
            callback(false, false);
        }
        //계정이 있을 경우
        else {
            callback(false, result[0]['user_no']);
        }
    });
}

exports.nick_exist_check = function(nick, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
        `SELECT user_no FROM users WHERE username = ?`;

    db.query(queryStr, [nick], (err, result) => {
        db.end();
        if (err) {
            console.error("query.js : nick_exist_check() query error.", err);
            callback(err, undefined);
            return;
        }

        if(result.length === 0) {
            callback(false, false);
        }
        else {
            callback(false, result[0]['user_no']);
        }
    });
}

exports.register = function(email, password, phone, userType, nick, callback) {
    generate_encrypted_password(password, (err, encryptedPassword, salt) => {
        let db = mysql.createConnection(dbconfig);
        db.connect();
        //계정 생성
        let queryStr =
            `INSERT INTO users(email, password, password_salt, user_type, username, phone, rated_times, rate_average, active, create_time)
                VALUES(?, ?, ?, ?, ?, ?, 0, 0, false, now())`;
        
        db.query(queryStr, [email, encryptedPassword, salt, userType, nick, phone], (_err, _result) => {
            if(_err) {
                console.error("register : query error.", _err);
                callback(_err, false);
                return;
            }

            //userId 가져오기
            queryStr = `SELECT LAST_INSERT_ID() as user_no`;
            db.query(queryStr, (err, data) => {
                db.end();
                callback(false, data[0]['user_no']);
            });
        });        
    });
}

exports.login_check = function(email, password, callback) {
    exports.user_exist_check(email, (err, userId) => {
        //유저가 없을 경우
        if(!userId) {
            callback(err, false);
            return;    
        }

        //유저가 있음
        let user = new exports.User(userId);
        user.get_userData((err, data) => {
            delete user;
            let userSalt = data['password_salt'];
            let userHash = data['password'];
            let active = data['active'];
    
            //유저가 활성화 상태일 경우
            if (active) {
                //비밀번호 확인
                hasher({ password: password, salt: userSalt }, (_err, pass, salt, hash) => {
                    if (_err) {
                        console.error(_err);
                        callback("error");
                    }
                    else {
                        if (hash === userHash) {
                            callback(userId);
                        }
                        else {
                            callback(false);
                        }
                    }
                });
            }
            //유저가 비활성화 상태
            else {
                callback(undefined);
            }
        });
    });
} 

//
exports.get_route_list = function(callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT * FROM routes`;

    db.query(queryStr, (err, result) => {
        db.end();
        if(err) {
           callback(err, undefined);
           return;
        }
        if(result.length === 0) {
           callback(false, []);
           return;
        }
        
        callback(false, result);
    });
}

exports.get_route_data = function(routeId, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();
    console.log("routeId : ", routeId);
    let queryStr =
    `SELECT * FROM routes WHERE route_no = ?`;
    db.query(queryStr, [routeId], (err, result) => {
        db.end();
        if(err) {
            console.error("get_routeData() : query error.", err);
            callback(err, undefined);
            return;
        }
        if(result.length === 0) {
           callback(false, undefined);
           return;
        }
        callback(false, result[0]);
    });
}

//
exports.get_post_list = function(routeId, date, callback) {
    let year = date.substring(0, 4);
    let month = date.substring(5, 7);
    let day = date.substring(8,10);

    //TIMESTAMP 형식
    let convDateStart = `${year}/${month}/${day} 00:00:00`;
    let convDateEnd = `${year}/${month}/${day} 23:59:59`;

    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT
        post_no, route_no, owner_user_no, owner_user_name, date_format(reservation_time, '%H시 %i분') as reservation_time, attend_taxi_no, attender_num, date_format(create_time, '%Y/%m/%d %H:%i:%s') as create_time
        FROM post 
        WHERE route_no = ?
            and (reservation_time >= str_to_date(?, '%Y/%m/%d %H:%i:%s'))
            and (reservation_time <= str_to_date(?, '%Y/%m/%d %H:%i:%s'))
        ORDER BY reservation_time ASC LIMIT 100`;

    db.query(queryStr, [routeId, convDateStart, convDateEnd], (err, result) => {
        db.end();
        if(err) {
            console.error("get_post_list : query error", err);
            callback(err, undefined);
            return;
        }
        callback(false, result);
    });
}