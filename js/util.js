/**
 * Удаление элемента из массива
 * */
Array.prototype.remove = function(i){
    this.splice(this.indexOf(i), 1);
    return this;
};

/**
 * Декодирование URL
 * */
function urldecode(str) {
    return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}

/**
 * Из URL в js объект
 * */
function parseURL(a){
    var params = urldecode((a || window.location.search).replace('?', '')).split('&');
    var data = {};
    for(var i=0;i<params.length;i++){
        var t = params[i].split('=');
        data[t[0]] = t[1];
    }
    return data;
}

function doubleString(char){
    return String(char).length>1?char:'0'+char;
}

function dateToDateString(date){
    return [
        doubleString(date.getDate()),
        doubleString(date.getMonth()),
        doubleString(date.getFullYear())
    ].join('.');
}

function timestampToDateString(timestamp){
    var dt = new Date(timestamp*1000);
    if(new Date().getDate() == dt.getDate()){
        return dt.toLocaleTimeString();
    }else{
        return dateToDateString(dt);
    }
}