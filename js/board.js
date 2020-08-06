function addSelectOption() {
    let today = new Date();

    //현재 날짜
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let currentDay = today.getDate();

    //선택한 날짜
    let year = getParameterByName("year");
    if(!year) {
        year = currentYear;
    }
    let month = getParameterByName("month");
    if(!month) {
        month = currentMonth + 1;
    }
    let day = getParameterByName("day");
    
    if(!day) {
        day = currentDay;
    }
    
    //Year 추가
    for(let i = currentYear; i < currentYear + 2; i++) {
        let newOption = new Option(i + "년", i);
        years.append(newOption);
        if(i.toString() === year.toString()) { //선택한 년도 선택
            newOption.selected = true;
        }
    }

    //Month 추가
    for(let i = 1; i <= 12; i++) {
        let newOption = new Option(i + "월", i);
        months.append(newOption);
        if(i.toString() === month.toString()) { //선택한 월 선택
            newOption.selected = true;
        }
    }

    //Day 추가
    if(month) {
        lastDayOfTheMonth = new Date(currentYear, month, 0).getDate();
    }
    else {
        lastDayOfTheMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    }

    for(let i = 1; i <= lastDayOfTheMonth; i++) {
        let newOption = new Option(i + "일", i);
        days.append(newOption);
        if(i.toString() === day.toString()) { //선택한 일 선택
            newOption.selected = true;
        }
    }
}

function monthChangeDetect() {
    //선택된 값 구하기
    let year = years.options[years.selectedIndex].value;
    let month = months.options[months.selectedIndex].value;
    let day = days.options[days.selectedIndex].value;

    days.options.length = 0;

    let lastDay = new Date(year, month, 0).getDate();
    
    for(let i = 1; i <= lastDay; i++) {
        let newOption = new Option(i + "일", i);
        days.append(newOption);
        if(i === day) {
            newOption.selected = true;
        }
    }
}

//URI 에서 parameter 추출
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}