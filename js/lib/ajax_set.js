function ajax_set_phone(newPhone, callback) {
    fetch(`/ajax/phone`,
        {
            method: "PUT",
            body: JSON.stringify({phone: newPhone}),
            headers: { "Content-Type": "application/json" } //json 형식으로 보내겠다는 헤더
        })
    .then(response => response.json()
        .then(result => {
            return callback(result.isChanged);
        })
    );
}

function ajax_set_nick(newNick, callback) {
    fetch(`/ajax/nick`,
        {
            method: "PUT",
            body: JSON.stringify({nick: newNick}),
            headers: { "Content-Type": "application/json" } //json 형식으로 보내겠다는 헤더
        })
    .then(response => response.json()
        .then(result => {
            return callback(result.isChanged);
        })
    );
}