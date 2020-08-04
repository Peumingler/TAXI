const query = require('../lib/query');

module.exports.INDEX = function(userNo, routelist) {
    //헤더쪽 로그인 버튼
    let loginBtnHref;
    let loginBtnMessage;
    if (userNo) {
        loginBtnHref = '/auth/logout';
        loginBtnMessage = '로그아웃';
    }
    else if (userNo === undefined) {
        loginBtnHref = '/auth/login';
        loginBtnMessage = '로그인 / 회원가입';
    }

    //루트 리스트
    let routes = ''; // 초기화를 안해주면 undefined가 나옴
    for(let i = 0; i < routelist.length; i++) {
        let routeNo = routelist[i]['route_no'];
        let departureName = routelist[i]['departure_name'];
        let destinationName = routelist[i]['destination_name'];
        routes = routes + 
            `<li class="routeBtn" onclick="location.href='/route/${routeNo}/postlist'">
                <sup>출발지</sup> ${departureName} <br><sup>목적지</sup> ${destinationName}
            </li>`
    }

    return `
    <!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1">
            <link rel="shortcut icon" href="/image/favicon.ico">
            <link rel="icon" href="/image/favicon.ico">
            <link rel="stylesheet" type="text/css" href="/css/layout.css">
            <link rel="stylesheet" type="text/css" href="/css/index.css">
            <title>가치타자</title>
        </head>
        <body>
            <header>
                <h1 class="title" onclick="location.href='/'">가치타자</h1>
                <!-- 로그인, 내 정보 관리 버튼 -->
                <nav class="box-container">
                    <div class="box"></div>
                        <ul class="menuList">
                            <li class="menuBtn">회원설정</li>
                            <li class="menuBtn" onclick="location.href='${loginBtnHref}'">${loginBtnMessage}</li>
                        </ul>
                    <div class="box"></div>
                </nav>
            </header>
            <!-- 노선 목록 -->
            <main class="box-container">
                <div class="box"></div>
                <ul class="routeList">
                    ${routes}
                </ul>
                <div class="box"></div>
            </main>
            <footer>

            </footer>
        </body>
    </html>
    `
}

module.exports.POSTLIST = function(userNo, routeNo, postList) {
    //헤더쪽 로그인 버튼
    let loginBtnHref;
    let loginBtnMessage;
    if (userNo) {
        loginBtnHref = '/auth/logout';
        loginBtnMessage = '로그아웃';
    }
    else if (userNo === undefined) {
        loginBtnHref = '/auth/login';
        loginBtnMessage = '로그인 / 회원가입';
    }

    //post 리스트 파싱
    let list = '';
    for(let i = 0; i < postList.length; i++) {
        let postNo      = postList[i]['post_no'];
        let ownerNo     = postList[i]['owner_user_no'];
        let ownerName   = postList[i]['owner_user_name'];
        let resTime     = postList[i]['reservation_time'];
        let attenderNum = postList[i]['attender_num'];

        list = list +
        `
        <tr class="postBtn" onclick="location.href='/route/${routeNo}/post/${postNo}'">
            <td>${postNo}</td>
            <td>${resTime}</td>
            <td>${ownerName}</td>
            <td>${attenderNum}/3</td>
        </tr>
        `;
    }

    return `
    <!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1">

            <!-- Bootstrap CDN -->
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3./css/bootstrap-theme.min.css">
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>


            <!-- custom library -->
            <link rel="shortcut icon" href="/image/favicon.ico">
            <link rel="icon" href="/image/favicon.ico">
            <link rel="stylesheet" type="text/css" href="/css/layout.css">
            <link rel="stylesheet" type="text/css" href="/css/board.css">
            <script src="/js/board.js"></script>

            <title>가치타자</title>
        </head>
        <body>
            <header>
                <h1 class="title" onclick="location.href='/'">가치타자</h1>
                <!-- 로그인, 내 정보 관리 버튼 -->
                <nav class="box-container">
                    <div class="box"></div>
                        <ul class="menuList">
                            <li class="menuBtn">회원설정</li>
                            <li class="menuBtn" onclick="location.href='${loginBtnHref}'">${loginBtnMessage}</li>
                        </ul>
                    <div class="box"></div>
                </nav>
            </header>
            <main class="box-container">
                <div class="box"></div>
                <!-- 날짜 선택기 -->
                <div class="divMain">
                    <form action="/route/${routeNo}/postlist" method="get" class="dateForm">
                        <p>
                            <select id="years" name="year" style="width: 100px;" onchange="monthChangeDetect()">
                            </select>

                            <select id="months" name="month" style="width: 80px;" onchange="monthChangeDetect()">
                            </select>

                            <select id="days" name="day" style="width: 80px;">
                            </select>
                            <input type="submit" value="검색"/>
                        </p>
                    </form>

                    <!-- select 옵션 추가 -->
                    <script>
                        addSelectOption();
                    </script>

                    <!-- 포스트 리스트 -->
                    <table class="table table-striped">
                        <thead>
                            <th>게시글 번호</th>
                            <th>시각</th>
                            <th>게시자</th>
                            <th>현재 인원</th>
                        </thead>
                        <tbody>
                            ${list}
                        </tbody>
                    </table>
                    <button type="button" class="writeBtn" onclick="location.href='../../'">뒤로가기</button>
                    <button class="writeBtn" onclick="location.href='/route/${routeNo}/write'">글작성</button>
                </div>
                <div class="box"></div>
            </main>
            <footer>

            </footer>
        </body>
    </html>
    `
}

module.exports.POST = function(userNo, postNo, alreadyAttended, isOwner, attenders, departure, destination, time, specificLoc) {
    //헤더쪽 로그인 버튼
    let loginBtnHref;
    let loginBtnMessage;
    if (userNo) {
        loginBtnHref = '/auth/logout';
        loginBtnMessage = '로그아웃';
    }
    else if (userNo === undefined) {
        loginBtnHref = '/auth/login';
        loginBtnMessage = '로그인 / 회원가입';
    }

    //참가, 참가 취소, 삭제 버튼 생성
    let btn = `<button type="button" class="btn" onclick="location.href='./${postNo}/attend'">참가</button>`;
    if(alreadyAttended === true) {
        btn = `<button type="button" class="btn" onclick="location.href='./${postNo}/attend_cancel'">참가 취소</button>`;
    }
    if(isOwner === true) {
        btn = `<button type="button" class="btn" onclick="location.href='./${postNo}/delete'">삭제</button>`;
    }

    //참가자 리스트 생성
    let attenderStr = attenders[0];
    for(let i = 1; i < attenders.length; i++) {
        attenderStr = attenderStr + " | " + attenders[i];
    }

    return `
    <!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1">
            <link rel="shortcut icon" href="/image/favicon.ico">
            <link rel="icon" href="/image/favicon.ico">
            <link rel="stylesheet" type="text/css" href="/css/layout.css">
            <link rel="stylesheet" type="text/css" href="/css/post.css">
            <title>가치타자 - 회원가입</title>
        </head>
        <body>
            <header>
                <h1 class="title" onclick="location.href='/'">가치타자</h1>
                <!-- 로그인, 내 정보 관리 버튼 -->
                <nav class="box-container">
                    <div class="box"></div>
                        <ul class="menuList">
                            <li class="menuBtn">회원설정</li>
                            <li class="menuBtn" onclick="location.href='${loginBtnHref}'">${loginBtnMessage}</li>
                        </ul>
                    <div class="box"></div>
                </nav>
            </header>
            <!-- 로그인 폼 -->
            <main class="box-container">
                <div class="box"></div>
                <div class="info">
                    <div>
                        <h4 class="infoTitle">노선</h4>
                        <p class="context">
                            ${departure} -> ${destination}
                        </p>
                        <hr>

                        <h4 class="infoTitle">탑승 시각</h4>
                        <p class="context">
                            ${time}
                        </p>
                        <hr>

                        <h4 class="infoTitle">탑승자</h4>
                        <p class="context">
                            ${attenderStr}
                        </p>
                        <hr>

                        <h4 class="infoTitle">탑승 상세 위치</h4>
                        <p class="context">
                            ${specificLoc}
                        </p>
                        <hr>
                    </div>
                    <button type="button" class="btn" onclick="location.href='../postlist'">뒤로가기</button>
                    ${btn}
                </div>
                <div class="box"></div>
            </main>
            <footer>

            </footer>
        </body>
    </html>`;
}

module.exports.WRITE = function(userNo, routeNo) {

    /*
    let routeNo = routelist[0]['route_no'];
    let departureName = routelist[0]['departure_name'];
    let destinationName = routelist[0]['destination_name'];
    */
    return `
    <!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1">
            <link rel="shortcut icon" href="/image/favicon.ico">
            <link rel="icon" href="/image/favicon.ico">
            <link rel="stylesheet" type="text/css" href="/css/layout.css">
            <link rel="stylesheet" type="text/css" href="/css/register.css">
            <title>가치타자 - 회원가입</title>
        </head>
        <body>
            <header>
                <h1 class="title" onclick="location.href='/'">가치타자</h1>
            </header>
            <!-- 로그인 폼 -->
            <main class="box-container">
                <div class="box"></div>
                <form action="/route/${routeNo}/write/process" method="post" class="register">
                    <p>
                        <label for="user_pw" class="label">탑승할 상세한 장소</labeL>
                        <input type="text"  name="specific_loc" id="user_pw" class="input" placeholder="Specific Locaiton"/>
                    </p>
                    <p>
                        <label for="date" class="label">날짜</labeL>
                        <input type="date" name="date" id="date" class="input"/>
                    </p>
                    <p>
                        <label for="user_phone" class="label">시각</labeL>
                        <input type="time" name="time" id="user_phone" class="input"/>
                    </p>
                    <input type="submit" id="submit" value="작성"/>
                </form>
                <div class="box"></div>
            </main>
            <footer>

            </footer>
        </body>
    </html>
    `;
}

module.exports.LOGIN = function(flashMsg) {
    return `
    <!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1">
            <link rel="shortcut icon" href="/image/favicon.ico">
            <link rel="icon" href="/image/favicon.ico">
            <link rel="stylesheet" type="text/css" href="/css/layout.css">
            <link rel="stylesheet" type="text/css" href="/css/login.css">
            <title>가치타자 - 회원가입</title>
        </head>
        <body>
            <header>
                <h1 class="title" onclick="location.href='/'">가치타자</h1>
            </header>
            <!-- 로그인 폼 -->
            <main class="box-container">
                <div class="box"></div>
                <form action="/auth/login/process" method="post" class="login">
                    <p>
                        <label for="user_email" class="label">이메일</labeL>
                        <input type="email" id="user_email" name="user_email" class="input" placeholder="E-MAIL"/>

                        <label for="user_pw" class="label">비밀번호</labeL>
                        <input type="password" id="user_pw" name="user_pw" class="input" placeholder="PASSWORD"/>
                    </p>
                    <div style="color:red; margin-bottom: 1rem; font-size:1.2rem; font-weight:bold;">${flashMsg}</div>
                    <input type="submit" id="submit" value="로그인"/>
                    <input type="button" id="submit" value="회원가입" onclick="location.href='/auth/register'"/>
                </form>
                <div class="box"></div>
            </main>
            <footer>

            </footer>
        </body>
    </html>
    `
}

module.exports.REGISTER = function(flashMsg) {
    return `
    <!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1">
            <link rel="shortcut icon" href="/image/favicon.ico">
            <link rel="icon" href="/image/favicon.ico">
            <link rel="stylesheet" type="text/css" href="/css/layout.css">
            <link rel="stylesheet" type="text/css" href="/css/register.css">
            <title>가치타자 - 회원가입</title>
        </head>
        <body>
            <header>
                <h1 class="title" onclick="location.href='/'">가치타자</h1>
            </header>
            <!-- 로그인 폼 -->
            <main class="box-container">
                <div class="box"></div>
                <form action="/auth/register/process" method="post" class="register">
                    <label for="user_email" class="label">이메일</labeL>
                    <input type="email"  name="email" id="user_email" class="input" placeholder="E-MAIL"/>

                    <label for="user_pw" class="label">비밀번호</labeL>
                    <input type="password"  name="password" id="user_pw" class="input" placeholder="PASSWORD"/>

                    <label for="user_phone" class="label">전화번호</labeL>
                    <input type="tel"  name="phone" id="user_phone" class="input" placeholder="PHONE NUMBER"/>

                    <div class="userType">
                        <label class="label"><input type="radio" name="user_type" value="1"/>택시기사</label>
                        <label class="label"><input type="radio" name="user_type" value="0"/>탑승자</label>
                    </div>

                    <p>
                        <labeL for="user_nickname" class="label">닉네임</labeL>
                        <input type="text" name="nick" id="user_nickname" class="input" placeholder="NICKNAME"/>
                    </p>
                    <div style="color:red; margin-bottom: 1rem; font-size:1.2rem; font-weight:bold;">${flashMsg}</div>
                    <input type="submit" id="submit" value="회원가입"/>
                </form>
                <div class="box"></div>
            </main>
            <footer>

            </footer>
        </body>
    </html>
    `
}