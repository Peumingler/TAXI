const mysql = require('mysql');
const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

const dbconfig = require('../config/database.json');
const query = require('./query');

/* 유저 클래스 */
exports.User = class User {
    constructor(userId) {
        this.userId = userId;
    }

    get_userData(callback) {
        if(this.userId === undefined) {
            callback(false, undefined);
            return;
        }

        let db = mysql.createConnection(dbconfig); 
        db.connect();
    
        let queryStr =
        `SELECT user_no, email, user_type, username, phone, rated_times, rate_average, create_time FROM users WHERE user_no = ${this.userId}`;
        
        db.query(queryStr, (err, result) => {
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

    set_post(routeId, specificLoc, date, time, callback) {
        this.get_userData((err, userData) => {
            if(err) {
                console.error("User.set_post() : get_userData Error.", err);
                callback(err, false);
                return;
            }
            let ownerName = userData['username'];
    
            let convDatetime = date + " " + time + ":00";
            
            //post 생성
            let db = mysql.createConnection(dbconfig); 
            db.connect();
            let queryStr = `
            INSERT INTO post (route_no, owner_user_no, owner_user_name, reservation_time, specific_loc, attender_num, create_time)
                VALUES(${routeId}, ${this.userId}, '${ownerName}', str_to_date('${convDatetime}', '%Y-%m-%d %H:%i:%s'), '${specificLoc}', 0, now())`;
            db.query(queryStr, (_err, result) => {
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
            WHERE post_no = ${this.postId}`;
    
        db.query(queryStr, (err, result) => {
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
        `DELETE FROM post_attender WHERE post_no = ${this.postId}`;
        db.query(queryStr, (err, result) => {
            if(err) {
                console.error("Post.delete() : post_attender query error.", err);
                callback(err, false);
                return;
            }
            //post 데이터 제거
            queryStr =
            `DELETE FROM post WHERE post_no = ${this.postId}`;
            db.query(queryStr, (err, result) => {
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
            `UPDATE post SET attender_num = ${attenderNum + 1} WHERE post_no = ${this.postId}`
            db.query(queryStr, (err, result) => {
                if(err) {
                    console.error("Post.set_attender() : UPDATE query Error.", err);
                    callback(err, false);
                    return;
                }
    
                //post_attender 업데이트
                queryStr =
                `INSERT INTO post_attender (post_no, attender_user_no, attender_user_name)
                    VALUES(${this.postId}, ${attenderId}, '${username}')`;
                
                db.query(queryStr, (_err, _result) => {
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
        `SELECT attender_user_no, attender_user_name FROM post_attender WHERE post_no = ${this.postId}`;
        db.query(queryStr, (err, list) => {
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
        `DELETE FROM post_attender WHERE (post_no = ${this.postId} and attender_user_no = ${userId})`;
    
        //post_attender 데이터 제거
        db.query(queryStr, (err, result) => {
            if(err) {
                console.error("del_attender : query error.", err);
                callback(err, false);
                return;
            }
            
            //post attender_num 업데이트를 위해 참가자수 가져오기
            this.get_data(this.postId, (_err, postData) => {
                if(_err || !postData) {
                    console.error("!!! del_attender : get_post : DB broken. have to reset tables.");
                    callback(_err, false);
                    return;
                }
                let attenderNum = postData['attender_num'];
                
                //post attender_num 업데이트    
                queryStr =
                `UPDATE post SET attender_num = ${attenderNum - 1} WHERE post_no = ${this.postId}`
                db.query(queryStr, (__err, __result) => {
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
    `SELECT route_no FROM post WHERE post_no = ${postId}`;

    db.query(queryStr, (err, routeData) => {
        if (err) {
            console.error("get_route_id_from_post : query error.");
            callback(err, false);
            return;
        }
        callback(false, routeData[0]['route_no']);
    });
}

exports.register = function(email, password, phone, user_type, nick, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    hasher({ password: password }, (err, pass, salt, hash) => { //암호화 SHA256
        if (err) {
            console.error("register : hasher error.", err);
            callback(err, undefined);
            return;
        }

        //계정 생성
        queryStr =
        `INSERT INTO users(email, password, password_salt, user_type, username, phone, rated_times, rate_average, create_time)
            VALUES('${email}', '${hash}', '${salt}', '${user_type}', '${nick}', '${phone}', 0, 0, now())`;
        
        db.query(queryStr, (_err, _result) => {
            db.end();
            if(_err) {
                console.error("register : query error.", _err);
                callback(_err, false);
                return;
            }
            callback(false, true);
            return;
        });
        return;
    });
}

exports.login_check = function(email, password, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT user_no, password, password_salt
        FROM users where email="${email}"`;

    //아이디 검색
    db.query(queryStr, (err, result) => {
        db.end();
        if(err) {
            console.error(err);
            callback("error");
            return;
        }
        if(result.length === 0) {
            callback(false);
            return;
        }
        var userNo = result[0]['user_no'];
        var userSalt = result[0]['password_salt'];
        var userHash = result[0]['password'];

        //비밀번호 확인
        hasher({ password : password, salt : userSalt }, (_err, pass, salt, hash) => {
            if(_err) {
                console.error(_err);
                callback("error");
            }
            else {
                console.log(hash.length);
                if(hash === userHash) {
                    callback(userNo);
                }
                else {
                    callback(false);
                }
            }
        });
    })

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
           callback(false, undefined);
           return;
        }

        /*
        let arr = {
            routeNo             : result[0]['route_no'],
            departureName       : result[0]['departure_name'],
            departureAddress    : result[0]['departure_address'],
            destinationName     : result[0]['destination_name'],
            destinationAddress  : result[0]['destination_address']
        }
        */
        callback(false, result);
    });
}

exports.get_route_data = function(routeId, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();
    console.log("routeId : ", routeId);
    let queryStr =
    `SELECT * FROM routes WHERE route_no = ${routeId}`;
    db.query(queryStr, (err, result) => {
        db.end();
        console.log(result);
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
    //TIMESTAMP 형식으로 변환
    let year = date.substring(0, 4);
    let month = date.substring(4, 6);
    let day = date.substring(6,8);

    let convDateStart = `${year}/${month}/${day} 00:00:00`;
    let convDateEnd = `${year}/${month}/${day} 23:59:59`;

    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT
        post_no, route_no, owner_user_no, owner_user_name, date_format(reservation_time, '%H시 %i분') as reservation_time, attend_taxi_no, attender_num, date_format(create_time, '%Y/%m/%d %H:%i:%s') as create_time
        FROM post 
        WHERE route_no = ${routeId}
            and (reservation_time >= str_to_date('${convDateStart}','%Y/%m/%d %H:%i:%s'))
            and (reservation_time <= str_to_date('${convDateEnd}','%Y/%m/%d %H:%i:%s'))
        ORDER BY reservation_time ASC LIMIT 100`;

    db.query(queryStr, (err, result) => {
        db.end();
        if(err) {
            console.error("get_post_list : query error", err);
            callback(err, undefined);
            return;
        }
        callback(false, result);
    });
}

/*
exports.get_post = function(postNo, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT
        post_no, route_no, owner_user_no, owner_user_name, date_format(reservation_time, '%Y-%m-%d %H시 %i분') as reservation_time, specific_loc, attend_taxi_no, attender_num
        FROM post 
        WHERE post_no = ${postNo}`;

    db.query(queryStr, (err, result) => {
        db.end();
        if(err) {
            console.error("get_post : query error.", err);
            callback(err, undefined);
            return;
        }
        callback(false, result[0]);
    });
}
*/
/*
exports.get_attender = function(postNo, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT attender_user_no, attender_user_name FROM post_attender WHERE post_no = ${postNo}`;
    db.query(queryStr, (err, list) => {
        db.end();
        if(err) {
            console.error("get_attender : query Error.", err);
            callback(err, undefined);
            return;
        }
        callback(false, list);
    });
}
*/
/*
exports.set_attender = function(postNo, userNo, username, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    //자리 남았나 확인을 위해 POST 데이터 가져오기
    query.get_post(postNo, (err, postData) => {
        if(err) {
            callback(err, undefined);
            return;
        }

        let attenderNum = postData['attender_num'];
        console.log(typeof(attenderNum));
        if(attenderNum > 2) { //꽉찼나 확인
            callback(false, false);
            return;
        }
        console.log("안참");

        //post의 attender_num 업데이트
        let queryStr =
        `UPDATE post SET attender_num = ${attenderNum + 1} WHERE post_no = ${postNo}`
        db.query(queryStr, (err, result) => {
            if(err) {
                console.error("set_attender : UPDATE query Error.", err);
                callback(err, false);
                return;
            }

            //post_attender 업데이트
            queryStr =
            `INSERT INTO post_attender (post_no, attender_user_no, attender_user_name)
                VALUES(${postNo}, ${userNo}, '${username}')`;
            
            db.query(queryStr, (_err, _result) => {
                db.end();
                if(_err) {
                    console.error("set_attender : query Error.", _err);
                    callback(_err, false);
                    return;
                }
                callback(false, true);
            });
        });
    });
}
*/

/*
exports.del_attender = function(postNo, userNo, callback) {
    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `DELETE FROM post_attender WHERE (post_no = ${postNo} and attender_user_no = ${userNo})`;

    //post_attender 데이터 제거
    db.query(queryStr, (err, result) => {
        if(err) {
            console.error("del_attender : query error.", err);
            callback(err, false);
            return;
        }
        
        //post attender_num 업데이트를 위해 참가자수 가져오기
        query.get_post(postNo, (_err, postData) => {
            if(_err) {
                console.error("!!! del_attender : get_post : DB broken. have to reset tables.");
                callback(_err, false);
                return;
            }
            let attenderNum = postData['attender_num'];
            
            //post attender_num 업데이트    
            queryStr =
            `UPDATE post SET attender_num = ${attenderNum - 1} WHERE post_no = ${postNo}`
            db.query(queryStr, (__err, __result) => {
                if(__err) {
                    console.error("del_attender : UPDATE query error.");
                    callback(__err, false);
                    return;
                }
                callback(false, true);
            });
        });
    });
}
*/

/*
exports.get_userData = function(userNo, callback) {
    if(userNo === undefined) {
        callback(false, undefined);
        return;
    }

    let db = mysql.createConnection(dbconfig);
    db.connect();

    let queryStr =
    `SELECT email, user_type, username, phone, rated_times, rate_average, create_time FROM users WHERE user_no = ${userNo}`
    
    db.query(queryStr, (err, result) => {
        db.end();
        if(err) {
            callback(err, undefined);
            return;
        }

        let resultData = result[0];
        callback(false, resultData);
    });
}
*/