/* Library */
const express = require('express');
const html = require('./html/template');
const query = require('./lib/query');

const app = express();

/* Middle Ware */
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');

/* Middle Ware Apply */
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(session({ //세션 설치
    secret            : 'thisismysecret',
    resave            : false,
    saveUninitialized : true,
    cookie            : {maxAge : 1000 * 60 * 60}
}));

app.use(passport.initialize());
app.use(passport.session()); //passport 세션 연동
app.use(flash()); //flash메세지 연동

/* Router */
const authRouter = require('./routes/auth');

app.use('/auth', authRouter);


//Static Services
app.use('/css',express.static('./css'));
app.use('/js', express.static('./js'));
app.use('/image', express.static('./images'));


app.get('/', (req, res, next) => {
    let userNo = req.user;

    query.get_route_list((err, result) => {
        if(!err) {
            res.send(html.INDEX(userNo, result));
        }
    });
});

//POSTLIST 보기
app.get('/route/:routeNumber/postlist/', (req, res, next) => {
    let userNo = req.user;
    let routeNo = req.params.routeNumber //시멘틱 URL 파싱

    //인터넷에 없던 get데이터 가져오는 방법(선택된 날짜구하기)
    let year;
    let month;
    let day;

    if(req.query.year || req.query.month || req.query.day) { //get데이터 있을 경우
        year = req.query.year;
        if(parseInt(req.query.month) < 10) { //Month Formatting
            month = "0" + req.query.month;
        }
        else {
            month = req.query.month;
        }

        if(parseInt(req.query.day) < 10) { //Day Formatting
            day = "0" + req.query.day;
        }
        else {
            day = req.query.day;
        }
    }
    else {  //없을 경우
        let today = new Date();
        year = today.getFullYear().toString();
        let todayMonth = today.getMonth() + 1;
        if(todayMonth < 10) { //Month Formatting
            month = "0" + todayMonth.toString();
        }
        else {
            month = todayMonth.toString();
        }

        if(today.getDate() < 10) { //Day Formatting
            day = "0" + today.getDate().toString();
        }
        else {
            day = today.getDate().toString();
        }
    }
    let selectedDate = year + month + day; //선택된 날짜 YYYYMMDD  string 형식

    //모집글 리스트 가져오기
    query.get_post_list(routeNo, selectedDate, (err, postlist) => {
        if(err) {
            console.error("Postlist Error : get_post_list Error");
            res.status(500).send("Server Error.");
            return;
        }
        res.send(html.POSTLIST(userNo, routeNo, postlist));
    });
});

//POST 본문
app.get('/route/:routeNumber/post/:postNumber', (req, res, next) => {
    if(!req.user) { //로그인 체크
        res.redirect("/auth/login");
        return;
    }
    let userNo = req.user;
    let routeNo = req.params.routeNumber;
    let postNo = req.params.postNumber;

    //template에 넘겨줄 데이터들
    let isAttended;
    let isOwner;
    let attenders = [];
    let departure;
    let destination;
    let time;
    let specificLoc;

    //모집글 데이터 얻기
    query.get_post(postNo, (err, postData) => {
        if(err) {
            res.status(500).send("Server Error.");
            return;
        }

        //게시글 주인인지 확인
        isOwner = false;
        if(userNo === postData['owner_user_no']) {
            isOwner = true;
        }
        
        time = postData['reservation_time'];
        specificLoc = postData['specific_loc'];
        //참가자 이름 얻기
        query.get_attender(postNo, (err, data) => {
            isAttended = false;
            for(let i = 0; i < data.length; i++ ) {
                if(userNo === data[i]['attender_user_no']) {
                    isAttended = true;
                }
                attenders.push(data[i]['attender_user_name']);
            }
            //출발지 도착지 얻기
            query.get_route(routeNo, (err, routeData) => {
                departure = routeData['departure_name'];
                destination = routeData['destination_name'];
                res.send(html.POST(userNo, postNo, isAttended, isOwner, attenders, departure, destination, time, specificLoc));
            });
        }); 
    });
});

//POST 참가 프로세스
app.get('/route/:routeNumber/post/:postNumber/attend', (req, res, next) => {
    if(!req.user) { //로그인 체크
        res.redirect("/auth/login");
        return;
    }
    let userNo = req.user;
    let postNo = req.params.postNumber;

    query.get_userData(userNo, (err, userData) => {
        let username = userData['username'];

        query.set_attender(postNo, userNo, username, (err, result) => {
            if(err) {
                res.status(500).send("Server Error.");
                return;
            }
            else if(result === true) {
                console.log("true use flash");
            }
            else if(result === false) {
                console.log("false use flash");
            }
            res.redirect(`../${postNo}`);
        });
    });
});

//POST 참가 취소 프로세스
app.get('/route/:routeNumber/post/:postNumber/attend_cancel', (req, res, next) => {
    if(!req.user) { //로그인 체크
        res.redirect("/auth/login");
        return;
    }

    let userNo = req.user;
    let postNo = req.params.postNumber;

    query.del_attender(postNo, userNo, (err, result) => {
        if(err) {
            res.status(500).send("Server Error.");
            return;
        }
        else if(result === true) {
            console.log("true use flash at attend_cancel");
        }
        else if(result === false) {
            console.log("false use flash at attend_cancel");
        }
        res.redirect(`../${postNo}`);
    });
});


//POST 생성
app.get('/route/:routeNumber/write', (req, res, next) => {
    if(!req.user) { //로그인 체크
        res.redirect("/auth/login");
        return;
    }

    let userNo = req.user;
    let routeNo = req.params.routeNumber;
    res.send(html.WRITE(userNo, routeNo));
});

//POST 생성 프로세스
app.post('/route/:routeNumber/write/process', (req, res, next) => {
    if(!req.user) { //로그인 체크
        res.redirect("/auth/login");
        return;
    }

    let userNo = req.user;
    let routeNo = req.params.routeNumber;
    let specificLoc = req.body.specific_loc;
    let date = req.body.date;
    let time = req.body.time;

    if(date === '' || time === '') { //date나 time 입력값이 없을경우 새로고침
        res.redirect(`/route/${routeNo}/write`);
        return;
    }
    else if(!userNo) {
        res.redirect("/auth/login");
        return;
    }
    //post 생성
    query.set_post(userNo, routeNo, specificLoc, date, time, (err, postNo, username) => {
        if(err) {
            res.status(500).send("Server Error.");
            return;
        }
        //소유주 attender에 추가
        query.set_attender(postNo, userNo, username ,(err, result) => {
            if(err) {
                res.status(500).send("Server Error.");
                return;
            }

            let year = date.substring(0, 4);
            let month = date.substring(5, 7);
            let day = date.substring(8, 10);

            if(parseInt(month) < 10) { //Month 포매팅
                month = month.substring(1, 2);
            }
            if(parseInt(day) < 10) { //Day 포매팅
                day = day.substring(1, 2);
            }
            res.redirect(`/route/${routeNo}/postlist?year=${year}&month=${month}&day=${day}`);
        });
    });
});

//POST 삭제
app.get('/route/:routeNumber/post/:postNumber/delete', (req, res, next) => {
    if(!req.user) { //로그인 체크
        res.redirect("/auth/login");
    }

    let userNo = req.user;
    let routeNo = req.params.routeNumber;
    let postNo = req.params.postNumber;

    //로그인한 계정 이름과 POST 소유주 이름과 일치 확인
    query.get_post(postNo, (err, postData) => {
        if(err) {
            res.status(500).send("Server Error.");
            return;
        }
        let ownerNo = postData['owner_user_no'];
        if(ownerNo !== userNo) { //소유주가 일치하지 않을 경우
            res.redirect(`../${postNo}`);
            return;
        }

        query.del_post(postNo, (_err, _result) => {
            if(_err) {
                res.status(500).send("Server Error.");
                return;
            }
            else if(_result === true) {
                console.log("true use flash at delete");
            }
            else if(_result === false) {
                console.log("false use flash at delete");
            }
            res.redirect(`/route/${routeNo}/postlist`);
        });
    });
});

app.listen(3000, () => console.log("Node.js Server Running."));