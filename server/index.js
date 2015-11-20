/**
 * Created by shoom on 19.11.15.
 */

var ws = require("nodejs-websocket");

var ids = 1;
var commands = {
    auth: function(data){
        if(data.name && data.sellerId){
            return {
                token: 'dfgerger343434',
                sellerName: 'Trainer'
            };
        }else if(data.token){
            return {
                token: 'dfgerger343434',
                sellerName: 'Trainer',
                name: 'shoom',
                messages: [
                    {
                        id: 1,
                        text: 'Hi shoom',
                        date: 1447933383
                    },
                    {
                        id: 2,
                        text: 'My friend',
                        date: 1447233383
                    }
                ]
            };
        }
    },
    message: function(data){
        return {
            date: data.date,
            id: ids++,
            accept: true
        };
    }
};

var server = ws.createServer(function (conn) {
    conn.on("text", function (str) {
        var data = JSON.parse(str);
        if(data.command && commands[data.command]){
            conn.sendText(JSON.stringify({command: data.command, data: commands[data.command](data.data)}));
        }
    });

    conn.on("close", function (code, reason) {
        console.log("Connection closed");
        clearInterval(interval);
    });

    var interval = setInterval(function(){
        var msg = {
            id: ids++,
            text: 'Now: '+new Date(),
            date: Date.now()/1000
        };
        conn.sendText(JSON.stringify({command: 'message', data: msg}));
    }, 5000);
}).listen(8001);