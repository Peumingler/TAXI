 function ajax_get_postlist (routeId, date, callback) {
    fetch(`/ajax/route/${routeId}/postlist?date=${date}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" } //json 형식으로 보내겠다는 헤더
        })
    .then(response => response.json()
        .then(list => {
            return callback(list);
        })
    );
}