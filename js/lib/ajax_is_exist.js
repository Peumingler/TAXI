function ajax_is_email_exist(email, callback) {
    fetch(`/ajax/email/isduplicated?email=${email}`,
        {
            method: "GET",
            //body: JSON.stringify({email: email}),
            headers: {"Content-Type": "application/json"} //json 형식으로 보내겠다는 헤더
        })
    .then(response => response.json()
        .then(result => {
            return callback(result.exist);
        })
    );
}

function ajax_is_nick_exist(nick, callback) {
    fetch(`/ajax/nick/isduplicated?nick=${nick}`,
    {
        method: "GET",
        //body: JSON.stringify({nick: nick}),
        headers: {"Content-Type": "application/json"} //json 형식으로 보내겠다는 헤더
    })
    .then(response => response.json()
        .then(result => {
            return callback(result.exist);
        })
    );
}