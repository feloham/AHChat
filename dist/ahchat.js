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

var Message = function(hash){
    this.attrs = {
        id: 0,
        text: '',
        date: 0,
        clientDate: 0,
        chatId: 0
    };

    /**
     * Rendering
     * */
    this.render = function(){
        var $el = $(this.tpl);
        $el.find('.text').text(this.attrs.text);
        $el.find('.date').text(timestampToDateString(this.attrs.date));
        if(this.my){
            $el.addClass('my');
        }
        this.$list.append($el);
        return this;
    };

    /**
     * Setter
     * @param data {object} datas
     * */
    this.set = function(data){
        for(var v in data){
            if(typeof this.attrs[v] != 'undefined'){
                this.attrs[v] = data[v];
            }
        }
        return this;
    };

    if(hash){
        this.set(hash);
    }
};

var Chat = function(id){
    this.id = id || 0;
    this.messages = {};
    this.messageBuffer = {};

    /**
     * Add array of messages
     * @param msg {Message}
     * */
    this.push = function(msg, render){
        if(!(msg instanceof Message)){
            msg = new Message(msg);
            msg.chatId = this.id;
        }
        this.messages[msg.attrs.id] = msg;
        if(render) msg.render();
        return false;
    };
    /**
     * Add array of messages
     * @param arr {Array} array of messages
     * @see this.push
     * */
    this.add = function(arr){
        for(var i=0; i<arr.length; i++){
            this.push(new Message(arr[i]));
        }
        return this;
    };
    /**
     * Accepting sended message
     * @param data {object} {id: 1, date: 234234}
     * */
    this.accept = function(data, render){
        if(data.id && data.clientDate){
            var msg = this.messageBuffer[data.clientDate];
            if(msg){
                msg.attrs.id = data.id;
                msg.attrs.date = data.date;
                msg.my = true;
                this.push(msg, render);
                delete this.messageBuffer[data.clientDate];
                return this;
            }
        }
        return false;
    };
    /**
     * Add message to buffer
     * */
    this.addBuffer = function(msg){
        msg.chatId = this.id;
        var message = new Message(msg);
        this.messageBuffer[message.attrs.clientDate] = message;
        return message;
    };
    this.render = function(){
        for(var v in this.messages){
            this.messages[v].render();
        }
    };
};

(function(factory){
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'));
    } else {
        factory(jQuery);
    }
})(function($){
    /**
     * Chat class
     * @param cfg {object} configuration
     * */
    var AHChat = function(cfg){
        //DOM element
        this.el = null;
        //jQuery element
        this.$el = null;
        //WebSocket
        this.ws = null;
        //Template of message
        this.msgTpl = '';
        //Auth token
        this.token = null;
        //chats
        this.chats = {};
        this.type = cfg.id?'seller':'user';

        /**
         * Initialize. Render, open socket and delegation events.
         * @see this.setToken
         * @see this.initSocket
         * @see this.delegateEvents
         * @see this.render
         * */
        this.initialize = function(){
            // #>1
            $.when(this.render(cfg.template)).done($.proxy(function(){
                $(document.body).append(this.el);
                this.setToken(localStorage.getItem('chatToken')||cfg.token);
                if(this.token){
                    this.initSocket(cfg.url);
                }
                this.delegateEvents();
            },this));
            return this;
        };

        /**
         * Rendering chat. Request template and add him to DOM
         * @param template {string} url to template
         * @return {jQuery.Deferred}
         * */
        this.render = function(template){
            return $.get(template, $.proxy(function(tpl){
                if(tpl){
                    this.$el = $(tpl);
                    this.el = this.$el.get(0);

                    var $tpl = this.$el.find('#messageTpl');
                    this.msgTpl = $tpl.html();
                    Message.prototype.tpl = this.msgTpl;
                    Message.prototype.$list = this.$el.find('.messages');
                    $tpl.remove();

                    var $chatTpl = this.$el.find('#chatTpl');
                    this.chatTpl = $chatTpl.html();
                    $chatTpl.remove();

                    this.$el.addClass(this.type);
                }
            },this));
        };

        /**
         * Binding events to dom elements
         * @see this.bindEvent
         * */
        this.delegateEvents = function(){
            return this.bindEvent('.fixed-btn > a', 'click', 'openWindow')
                .bindEvent('.close-window', 'click', 'closeWindow')
                .bindEvent('.auth-btn', 'click', 'authorization')
                .bindEvent('form.textInp', 'submit', 'sendMessage');
        };

        /**
         * Initialization of WebSocket
         * @param url {string} url of socket
         * @see WebSocket
         * @see this.ws
         * */
        this.initSocket = function(url){
            if(url){
                this.ws = new WebSocket(url);
                var self = this;
                this.ws.onopen = function(){
                    self.evt('socketOpen');
                };
                this.ws.onclose = function(){
                    self.evt('socketClose');
                };
                this.ws.onmessage = function(res){
                    self.evt('socketMessage', res);
                };
                this.ws.onerror = function(res){
                    self.evt('socketError', res);
                };
                return this;
            }
            return false;
        };

        /**
         * Socket request
         * @param command {string} command
         * @param data {object} data
         * */
        this.callSocket = function(command, data){
            if(this.ws && this.ws.readyState == 1 && command){
                var req = {command: command};
                if(data){
                    req.data = data;
                }
                this.ws.send(JSON.stringify(req));
                return this;
            }else{
                return false;
            }
        };

        /**
         * Add new chat
         * @param id {int} id
         * @param data {object} data
         * */
        this.addChat = function(id, data){
            var chat = new Chat(id);
            if(data && data.messages){
                chat.add(data.messages);
            }
            this.chats[chat.id] = chat;
            if(this.type == 'seller'){
                var $list = this.$el.find('.fixed-btn .chats .list');
                var $chat = $(this.chatTpl);
                $chat.find('a').text(chat.chatter)
            }
        };
        /**
         * Get first chat
         * @return {Chat|null}
         * */
        this.firstChat = function(){
            for(var v in this.chats){
                return this.chats[v];
                break;
            }
            return null;
        };
        /**
         * Enable chat functionality
         * */
        this.openChat = function(chatId){
            this.$el.addClass('chat');
            if(chatId){
                this.currentChat = this.chats[chatId];
            }else{
                this.currentChat = this.firstChat();
                if(!this.currentChat){
                    this.addChat(0);
                    this.currentChat = this.firstChat();
                }
            }
            this.currentChat.render();

            return this;
        };

        /**
         * Authorization token setter
         * @param token {string} token
         * */
        this.setToken = function(token){
            if(token){
                this.token = token;
                localStorage.setItem('chatToken', this.token);
                return this;
            }
            return false;
        };

        /**
         * Binding event to dom element
         * @param selector {string} element selector
         * @param event {string} event of element
         * @param method {string} method of this.evt
         * @see this.evt
         * */
        this.bindEvent = function(selector, event, method){
            var self = this;
            this.$el.find(selector).off(event)
                .on(event, function(e){
                    self.evt(method, e);
                });
            return this;
        };

        /**
         * Triggering method of section
         * @param section {string} name of section
         * @param args {Arguments} arguments
         * */
        this.triggerMethod = function(section, args){
            var params = Array.prototype.slice.call(args);
            return this[section][params.shift()].apply(this, params);
        };

        /**
         * Section for work with events
         * */
        this.event = {
            /* @this AHChat */
            openWindow: function(){
                this.$el.addClass('open');
                if(this.type == 'user'){
                    if(this.token){
                        this.openChat();
                    }
                }
            },
            /* @this AHChat */
            closeWindow: function(){
                this.$el.removeClass('open');
            },
            /* @this AHChat */
            authorization: function(){
                // #>2.2
                var $nameInp = this.$el.find('.auth input');
                var name = $nameInp.val();

                $nameInp.parent().removeClass('error');

                if(name){
                    this.name = name;
                    this.initSocket(cfg.url);
                }else{
                    $nameInp.parent().addClass('error');
                }
            },
            /* @this AHChat */
            sendMessage: function(e){
                e.preventDefault();
                var $textarea = this.$el.find('.msg-text');
                var text = $textarea.val();
                $textarea.val('');

                if(text){
                    var msg = this.currentChat.addBuffer({
                        text: text,
                        clientDate: parseInt(Date.now()/1000),
                        chatId: this.currentChat.id
                    });
                    this.req('message', msg.attrs);
                    return this;
                }
                return false;
            },
            /* @this AHChat */
            socketOpen: function(){
                // #>2.2.1
                this.req('auth', this.token, this.name, cfg.sellerId, cfg.id);
            },
            /* @this AHChat */
            socketMessage: function(res){
                if(res && res.data){
                    var data = JSON.parse(res.data);
                    if(data.command && this.response[data.command]){
                        this.res(data.command, data.data);
                    }
                }
            },
            /* @this AHChat */
            socketClose: function(){

            },
            /* @this AHChat */
            socketError: function(){

            }
        };

        /**
         * Trigger for event section
         * @see this.event
         * @see this.triggerMethod
         * */
        this.evt = function(){
            return this.triggerMethod('event', arguments);
        };

        /**
         * Section for work with requests
         * */
        this.request = {
            /* @this AHChat */
            auth: function(token, name, sellerId, myId){
                var data = {};
                if(token){
                    data.token = token;
                }
                if(name){
                    data.name = name;
                }
                if(sellerId){
                    data.sellerId = sellerId;
                }
                if(myId){
                    data.id = myId;
                }
                this.callSocket('auth', data);
            },
            /* @this AHChat */
            message: function(msg){
                return this.callSocket('message', msg);
            }
        };

        /**
         * Trigger for request section
         * @see this.request
         * @see this.triggerMethod
         * */
        this.req = function(){
            return this.triggerMethod('request', arguments);
        };

        /**
         * Section for work with responses
         * */
        this.response = {
            /* @this AHChat */
            auth: function(data){
                if(data.name) this.name = data.name;
                if(data.chats){
                    for(var v in data.chats){
                        this.addChat(v, data.chats[v]);
                    }
                }
                if(data.token){
                    this.setToken(data.token);
                    this.openChat();
                }
            },
            /* @this AHChat */
            message: function(data){
                if(data.chatId){
                    var chat = this.chats[data.chatId];
                    var render = this.currentChat.id == chat.id;
                    if(data.clientDate){
                        chat.accept(data, render);
                    }else{
                        chat.push(data, render);
                    }
                }
            }
        };

        /**
         * Trigger for response section
         * @see this.response
         * @see this.triggerMethod
         * */
        this.res = function(){
            return this.triggerMethod('response', arguments);
        };
    };

    return AHChat;
});