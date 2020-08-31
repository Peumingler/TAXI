function is_same() {
    document.getElementById("pw_check_msg").innerHTML = '';

    let pw = document.getElementById("user_pw").value;
    let confirm_pw = document.getElementById("confirm_pw").value;

    if(pw === "" || confirm_pw === "") {
        return;
    }

    let checkMsg = document.getElementById("pw_check_msg");

    if (pw === confirm_pw) {
        checkMsg.innerHTML = "비밀번호가 일치합니다.";
        checkMsg.style.color = "blue";
    }
    else {
        checkMsg.innerHTML = "비밀번호가 일치하지 않습니다.";
        checkMsg.style.color = "red";
    }
}

function is_nickname() {
    let newNick = document.getElementById('user_nickname').value;
    let msg = document.getElementById('nick_check_msg');
    
    msg.innerHTML = "";

    ajax_is_nick_exist(newNick, (isExist) => {
        if (isExist) {
            msg.style.color = "red";
            msg.innerHTML = "이미 있는 닉네임 입니다.";
        }
        else {
            msg.style.color = "blue";
            msg.innerHTML = "사용가능한 이메일 입니다.";
        }
    });
}


//ajax functions
function change_phone() {
    let newPhone = document.getElementById('user_phone').value;
    let msg = document.getElementById('phone_check_msg');

    msg.innerHTML = "";

    ajax_set_phone(newPhone, (result) => {
        if (result) {
            msg.style.color = "blue";
            msg.innerHTML = "전화번호가 변경되었습니다.";
        }
        else {
            msg.style.color = "red";
            msg.innerHTML = "전화번호 변경에 실패했습니다.";
        }
    });
}

function change_nick() {
    let newNick = document.getElementById('user_nickname').value;
    let msg = document.getElementById('nick_check_msg');

    msg.innerHTML = "";

    ajax_set_nick(newNick, (result) => {
        if (result) {
            msg.style.color = "blue";
            msg.innerHTML = "닉네임이 변경되었습니다.";
        }
        else {
            msg.style.color = "red";
            msg.innerHTML = "닉네임 변경에 실패했습니다.";
        }
    });
}