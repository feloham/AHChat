/**
 * Created by shoom on 19.11.15.
 */

var ws = require("nodejs-websocket");

var ids = 1;
var commands = {
    auth: function(data){
        if(data.name && data.sellerId && !data.token){
            return {
                token: 'dfgerger343434',
                chats: {
                    1: {chatter: 'Trainer'}
                }
            };
        }else if(data.token){
            if(data.id){
                return {
                    name: 'Shooom3301',
                    chats: {
                        1: {
                            chatter: 'shoom 1',
                            messages: [
                                {
                                    id: 1,
                                    text: '3w4t4t33',
                                    date: 1447933383,
                                    my: true
                                },
                                {
                                    id: 2,
                                    text: 'dfgdfgd',
                                    date: 1447233383
                                }
                            ]
                        },
                        2: {
                            chatter: 'shoom 2',
                            messages: [
                                {
                                    id: 1,
                                    text: '2222222',
                                    date: 1447933383
                                },
                                {
                                    id: 2,
                                    text: '33333333333',
                                    date: 1447233383
                                }
                            ]
                        },
                        3: {
                            chatter: 'shoom 3',
                            messages: [
                                {
                                    id: 1,
                                    text: '44444444',
                                    date: 1447933383
                                },
                                {
                                    id: 2,
                                    text: '5555555555',
                                    date: 1447233383
                                }
                            ]
                        }
                    }
                };
            }else{
                return {
                    name: 'shoom',
                    chats: {
                        1: {
                            chatter: 'Trainer',
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
                        }
                    }
                };
            }
        }
    },
    message: function(data){
        return {
            clientDate: data.clientDate,
            chatId: data.chatId,
            date: parseInt(Date.now()/1000),
            id: ids++
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
        clearTimeout(timeout);
    });

    var interval = setInterval(function(){
        var msg = {
            id: ids++,
            text: 'Now: '+new Date(),
            date: Date.now()/1000,
            chatId: 1
        };
        conn.sendText(JSON.stringify({command: 'message', data: msg}));
    }, 5000);

    var timeout = setTimeout(function(){
        var chat = {
            id: 18,
            chatter: 'Muuusa'
        };
        conn.sendText(JSON.stringify({command: 'chat', data: chat}));
    }, 3000);
}).listen(8001);