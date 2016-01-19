"use strict";

(function(factory){
    if (typeof define === "function" && define.amd) {
        define(["jquery", "nanoscroller"], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery', 'nanoscroller'));
    } else {
        factory(jQuery);
    }
})(function($){
    /**
     * Adding leading zero if necessary (1 -> 01)
     * @param char {string|number}
     * @returns {string}
     */
    function doubleString(char){
        return String(char).length>1?char:'0'+char;
    }
    /**
     * Format date to "10.11.2011"
     * @param date {Date}
     * @returns {string}
     */
    function dateToDateString(date){
        return [
            doubleString(date.getDate()),
            doubleString(date.getMonth()),
            doubleString(date.getFullYear())
        ].join('.');
    }
    /**
     * Convert timestamp to time string
     * if date of timestamp == current date, return in format "12:00:05", else "24.11.2015"
     * @param timestamp {int}
     * @returns {string}
     */
    function timestampToDateString(timestamp){
        var dt = new Date(timestamp*1000);
        if(new Date().getDate() == dt.getDate()){
            return dt.toLocaleTimeString();
        }else{
            return dateToDateString(dt);
        }
    }
    /**
     * Cut string if its length greater than length
     * @param text {string}
     * @param len {int}
     * @returns {string}
     */
    function stringMax(text, len){
        return text.length>len?(text.substr(0 ,len-3)+'...'):text;
    }

    /**
     * Message class
     * @param hash {object} data
     * */
    var Message = function(hash){
        /**
         * Attributes of message
         * */
        this.attrs = {
            id: 0,
            text: '',
            date: 0,
            clientDate: 0,
            chatId: 0,
            my: false
        };

        /**
         * Rendering
         * */
        this.render = function(){
            var $el = $(this.tpl);
            $el.find('.text').text(this.attrs.text);
            $el.find('.date').text(timestampToDateString(this.attrs.date));
            if(this.attrs.my){
                $el.addClass('my');
            }
            this.$list.append($el);
            var $list = this.$list.parent().nanoScroller();
            if(!this._msgHover){
                $list.nanoScroller({ scroll: 'bottom' });
            }
            return this;
        };

        /**
         * Setter
         * @param data {object} datas
         * */
        this.set = function(data){
            for(var v in data){
                if(data.hasOwnProperty(v)){
                    if(typeof this.attrs[v] != 'undefined'){
                        this.attrs[v] = data[v];
                    }
                }
            }
            return this;
        };

        //Initialize
        if(hash){
            this.set(hash);
        }
    };

    /**
     * Chat class
     * @param id {int} id of chat
     * */
    var Chat = function(id){
        //Id of chat
        this.id = id || 0;
        //Messages of chat
        this.messages = {};
        //Buffer of sended messages
        this.messageBuffer = {};

        /**
         * Add array of messages
         * @param msg {Message}
         * @param render {bool} render message after push
         * */
        this.push = function(msg, render){
            if(!(msg instanceof Message)){
                msg['chatId'] = this.id;
                msg = new Message(msg);
            }
            this.messages[msg.attrs.id] = msg;
            if(render){
                msg.render();
            }
            for(var i=0; i<this._msgAddEvents.length; i++){
                this._msgAddEvents[i](msg, this);
            }
            return this;
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
         * @param render {bool} render message after push
         * */
        this.accept = function(data, render){
            if(data.id && data.clientDate){
                var msg = this.messageBuffer[data.clientDate];
                if(msg){
                    msg.attrs.id = data.id;
                    msg.attrs.date = data.date;
                    msg.attrs.my = true;
                    this.push(msg, render);
                    delete this.messageBuffer[data.clientDate];
                    return this;
                }
            }
            return false;
        };
        /**
         * Add message to buffer
         * @param msg {object} hash of message
         * @return {Message} message
         * */
        this.addBuffer = function(msg){
            msg['chatId'] = this.id;
            var message = new Message(msg);
            this.messageBuffer[message.attrs.clientDate] = message;
            return message;
        };
        /**
         * Render all messages in chat
         */
        this.render = function(){
            Message.prototype.$list.empty();
            for(var v in this.messages){
                if(this.messages.hasOwnProperty(v)) this.messages[v].render();
            }
        };
        /**
         * Callback storage
         * */
        this._msgAddEvents = [];
        /**
         * Binder for add message event
         * @param callback {function} callback
         * */
        this.onAddMessage = function(callback){
            this._msgAddEvents.push(callback);
            return this;
        };
    };

    /**
     * Array of errors, where key is code of error and value is handle method.
     */
    var ERRORS = {
        'CHAT_NOT_FOUND': {
            method: 'defaultError',
            text: 'Чат не найден'
        },
        'USER_IS_NOT_ONLINE': {
            method: 'notOnline',
            text: 'Пользователь не в сети'
        },
        'USER_IS_NOT_SELLER': {
            method: 'notPermission',
            text: 'Вы не можете авторизоваться как продавец'
        },
        'USER_NOT_FOUND': {
            method: 'oldToken',
            text: 'Сессия устарела, пожалуйста авторизуйтесь заново.'
        },
        'CHAT_ID_IS_REQUIRED': {
            method: 'defaultError',
            text: 'Chat id is required'
        },
        'TEXT_IS_REQUIRED': {
            method: 'defaultError',
            text: 'Text is required'
        },
        'DATE_IS_REQUIRED': {
            method: 'defaultError',
            text: 'Date is required'
        },
        USER_HAS_NO_PERMISSION: {
            method: 'defaultError',
            text: 'Вы не можете выполнить это действие.'
        }
    };

    /**
     * i18n
     * @type {object}
     */
    var TEXT = {
        user_not_online: 'Пользователь не в сети'
    };

    /**
     * AHChat, Chat class
     * @param cfg {object} configuration
     * */
    var AHChat = function(cfg){
        cfg = $.extend({
            lastMsgLength: 35,
            template: 'dist/chat.tpl',
            reconnectCount: 4,
            reconnectTime: 5000,
            ERRORS: null,
            TEXT: null
        }, cfg || {});

        if(cfg.ERRORS) ERRORS = cfg.ERRORS;
        if(cfg.TEXT) TEXT = cfg.TEXT;

        /**
         * Initialize. Render, open socket and delegation events.
         * @see this.setToken
         * @see this.initSocket
         * @see this.delegateEvents
         * @see this.render
         * */
        this.initialize = function(){
            // #>1
            var operation;
            if(cfg.templateHTML){
                operation = this.render(null, cfg.templateHTML);
            }else if(cfg.template){
                operation = this.render(cfg.template);
            }
            $.when(operation.done($.proxy(function(){
                this.setToken(cfg.token || localStorage.getItem('chatToken'));
                if(this.token) this.initSocket(cfg.url);
            },this)));
            return this;
        };

        /**
         * Destroy
         */
        this.destroy = function(){
            this._dontreconnect = true;
            clearInterval(this._reconnect);
            if(this.ws) this.ws.close(1000);
            this.ws = null;
            if(this.$el) this.$el.remove();
            this.reset();
        };

        /**
         * Rendering chat. Request template and add him to DOM
         * @param template {string} url to template
         * @param templateHTML {string} template html
         * @return {jQuery.Deferred}
         * */
        this.render = function(template, templateHTML){
            var df = $.Deferred();
            var cb = $.proxy(function(tpl){
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

                    var $body = $(document.body);
                    $body.find('.ah-chat').remove();
                    $body.append(this.el);

                    this.delegateEvents();

                    df.resolve();
                }
            } ,this);
            if(template){
                this.get(template, cb);
            }else if(templateHTML){
                cb(templateHTML);
            }
            return df.promise();
        };
        /**
         * Ajax
         * @param url {string} url
         * @param success {function} callback
         * @param error {function} callback
         * @return {XMLHttpRequest}
         * */
        this.get = function(url, success, error){
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.send();
            xhr.onreadystatechange = function() {
                if (xhr.readyState != 4) return;

                if (xhr.status != 200) {
                    if(error) error(xhr.responseText, xhr);
                } else {
                    if(success) success(xhr.responseText, xhr);
                }

            };
            return xhr;
        };

        /**
         * Binding events to dom elements
         * @see this.bindEvent
         * */
        this.delegateEvents = function(){
            return this.bindEvent('.fixed-btn > a', 'click', 'openWindow')
                .bindEvent('.close-window', 'click', 'closeWindow')
                .bindEvent('.auth-btn', 'click', 'authorization')
                .bindEvent('.send-btn', 'click', 'sendMessage')
                .bindEvent('.msg-text', 'keypress', 'sendByEnter')
                .bindEvent('.messages', 'mouseover', 'messagesHover')
                .bindEvent('.messages', 'mouseleave', 'messagesOut')
                .bindEvent('.error', 'click', 'closeError');
        };

        this.reset = function(){
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
            //type of chat
            this.type = cfg.id?'seller':'user';
            //Socket is opened
            this.socketOpened = false;
            //Timer to reconnect
            this._reconnect = 0;
        };

        /**
         * Initialization of WebSocket
         * @param url {string} url of socket
         * @param force {bool} force init socket
         * @see WebSocket
         * @see this.ws
         * */
        this.initSocket = function(url, force){
            if(force){
                if(this.ws) this.ws.close(3008);
                delete this.ws;
            }
            if(url && !this.ws){
                this.ws = new WebSocket(url);
                var self = this;

                this.ws.onopen = function(res){
                    self.evt('socketOpen', res);
                };
                this.ws.onclose = function(e){
                    self.evt('socketClose', e);
                };
                this.ws.onmessage = function(res){
                    self.evt('socketMessage', res);
                };
                this.ws.onerror = function(res){
                    return self.evt('socketError', res);
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
            this.$el.removeClass('have-not-chat');
            if(this.chats[id]) return;
            var chat = new Chat(id);
            var count = 0;
            for(var v in this.chats) count++;
            if(!count) this.currentChat = chat;
            if(data){
                if(data.chatter) chat.chatter = data.chatter;
                if(data.item) chat.item = data.item;
            }

            this.chats[chat.id] = chat;
            if(this.type == 'seller'){
                var $list = this.$el.find('.chats .list');
                var $chat = $(this.chatTpl);
                var self = this;
                chat.onAddMessage(function(msg){
                    $chat.find('p').text(stringMax(msg.attrs.text, cfg.lastMsgLength));
                    if(!self.$el.hasClass('open')){
                        self.newChatMessage(chat, $chat);
                    }
                });
                $chat.find('a').text(chat.chatter);
                $chat.click(function(e){
                    var targ = $(e.target);
                    if(targ.hasClass('remove') || targ.parent().hasClass('remove') || chat.disabled) return;
                    $(this).removeClass('new');
                    self.openChat(chat.id);
                });
                $chat.find('button.remove').click(function(e){
                    self.chatDestroy(chat.id);
                });
                $list.append($chat);
                chat.$el = $chat;
            }
            if(data && data.messages) chat.add(data.messages);
        };
        /**
         * Destroy chat
         */
        this.chatDestroy = function(chatId){
            this.req('finish', chatId);
        };
        /**
         * Set chat element in list status 'new'
         * @param chat {Chat}
         * @param $chat {jQuery} element in list
         */
        this.newChatMessage = function(chat, $chat){
            $chat.addClass('new');
            this.$el.find('.fixed-btn .chats-btn').addClass('new');
        };
        /**
         * Chat is current?
         * @param chat {Chat}
         * @returns {boolean}
         */
        this.isCurrentChat = function(chat){
            return this.currentChat?(chat.id == this.currentChat.id):false;
        };
        /**
         * Get first chat
         * @return {Chat|null}
         * */
        this.firstChat = function(){
            for(var v in this.chats){
                if(this.chats.hasOwnProperty(v)){
                    return this.chats[v];
                }
            }
            return null;
        };
        /**
         * Enable chat functionality
         * */
        this.openChat = function(chatId){
            if(chatId){
                this.currentChat = this.chats[chatId];
            }else{
                this.currentChat = this.firstChat();
            }
            this.$el.addClass(this.currentChat?'chat':'have-not-chat');
            if(this.currentChat){
                this.currentChat.render();
                if(this.currentChat.status === false){
                    this.$el.find('.msg-text').removeAttr('contenteditable').html(TEXT['user_not_online']+'...');
                }else{
                    this.$el.find('.msg-text').attr('contenteditable', true).html('');
                }
                this.$el.find('.sellerName').text(this.currentChat.chatter || 'Диалог');
            }

            this.evt('chatOpen', this.currentChat);

            return this;
        };

        /**
         * Authorization token setter
         * @param token {string} token
         * */
        this.setToken = function(token){
            if(typeof token != 'undefined'){
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
            var params = Array.prototype.slice.call(args), func = this[section][params.shift()];
            return func?func.apply(this, params):null;
        };

        /**
         * Section for work with events
         * */
        this.event = {
            /* @this AHChat */
            openWindow: function(){
                this.$el[this.currentChat?'removeClass':'addClass']('have-not-chat');
                this.$el.addClass('open');
                if(this.type == 'user'){
                    if(this.token && this.socketOpened){
                        this.openChat();
                    }
                }
                this.$el.find('.chats-btn').removeClass('new');
                var $list = Message.prototype.$list;
                if($list) $list.parent().nanoScroller();
            },
            /* @this AHChat */
            closeWindow: function(){
                if(this.type != 'seller' || !this.$el.hasClass('chat')){
                    this.$el.removeClass('open');
                }
                this.$el.removeClass('chat');
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
            sendMessage: function(){
                var $textarea = this.$el.find('.msg-text');
                if(!$textarea.attr('contenteditable')) return false;

                var text = $textarea.text();
                $textarea.text('');

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
            /**
             * @this AHChat
             * Send message by press enter
             * @param e {Event}
             * */
            sendByEnter: function(e){
                if(e && e.keyCode == 13 && !e.shiftKey){
                    this.evt('sendMessage');
                }
                return this;
            },
            /**
             * When list of messages hovered
             * */
            messagesHover: function(){
                Message.prototype._msgHover = true;
            },
            /**
             * When list of messages un-hovered
             * */
            messagesOut: function(){
                Message.prototype._msgHover = false;
            },
            /**
             * Close error text
             */
            closeError: function(){
                this.$el.find('.error').fadeOut(200);
            },
            /* @this AHChat */
            socketOpen: function(){
                // #>2.2.1
                this.socketOpened = true;
                this.req('auth', this.token, this.name, cfg.profile, cfg.id);
            },
            /* @this AHChat */
            socketMessage: function(res){
                console.log('CHAT_DATA: ', res);
                if(res && res.data){
                    var data = JSON.parse(res.data);
                    if(data.error){
                        var text = ERRORS[data.error]?ERRORS[data.error].text:'';
                        this.err(ERRORS[data.error]?ERRORS[data.error].method:'defaultError', text, data);
                    }else if(data.command && this.response[data.command]){
                        this.res(data.command, data.data);
                    }
                }
            },
            /* @this AHChat */
            socketClose: function(){
                this.evt('serverUnavailable');
            },
            /* @this AHChat */
            socketError: function(e){
                e.preventDefault();
                console.warn('AHChat: You can not open a connection, the server is unavailable.');
                this.evt('serverUnavailable');
                return true;
            },
            /**
             * When cant connect to server
             * @see this._reconnect
             * @this AHChat
             */
            serverUnavailable: function(){
                if(!this._reconnect && !this._dontreconnect){
                    var self = this;
                    var tryis = Number(cfg.reconnectCount);

                    this._reconnect = setInterval(function(){
                        self.initSocket(cfg.url, true);
                        tryis--;
                        if(tryis==0){
                            clearInterval(self._reconnect);
                        }
                    }, cfg.reconnectTime);

                    this.$el.removeClass('chat');
                    this.$el.find('.auth').addClass('unavailable');
                }
            },
            /**
             * When try to connect is success
             * @see this._reconnect
             * @this AHChat
             */
            serverAvailable: function(){
                clearInterval(this._reconnect);
                delete this._reconnect;
                this._dontreconnect = null;
                this.$el.find('.auth').removeClass('unavailable');

            },
            /**
             * When chatter is online
             * @this AHChat
             * @param chat {Chat}
             */
            online: function(chat){
                this.$el.addClass('chat');
                this.$el.find('.auth').removeClass('notOnline');
                if(this.isCurrentChat(chat)){
                    this.$el.find('.msg-text').attr('contenteditable', true).html('');
                }
            }
        };

        $.extend(this.event, cfg.event || {});

        /**
         * Trigger for event section
         * @see this.event
         * @see this.triggerMethod
         * */
        this.evt = function(){
            return this.triggerMethod('event', arguments);
        };

        /**
         * Section for handle errors
         */
        this.errors = {
            /**
             * Default handler for errors
             * @this AHChat
             * @param text {string} error text
             */
            defaultError: function(text){
                var selector = this.$el.hasClass('seller')?'.chats > .error':'.panel > .error';
                this.$el.find(selector).text(text).fadeIn(200);
            },
            /**
             * If chatter is offline
             * @param chat {Chat}
             * @this AHChat
             */
            notOnline: function(chat){
                if(this.isCurrentChat(chat)){
                    this.$el.removeClass('chat');
                    this.openChat(chat.id);
                }
                this.$el.find('.auth').addClass('notOnline');
            },
            /**
             * If user have not permisson
             * @this AHChat
             * @param text {string} error text
             */
            notPermission: function(text){
                this.err('defaultError', text);
                this.$el.removeClass('chat');
            },
            /**
             * If user token is old
             * @this AHChat
             */
            oldToken: function(){
                this.evt('serverAvailable');
                this._dontreconnect = true;
                this.ws.close(3003);
                this.setToken('');
                this.reset();
                this.type = 'user';
                if(cfg.templateHTML){
                    this.render(null, cfg.templateHTML);
                }else if(cfg.template){
                    this.render(cfg.template);
                }
            }
        };

        $.extend(this.errors, cfg.errors || {});

        /**
         * Trigger for errors section
         * @see this.event
         * @see this.triggerMethod
         * */
        this.err = function(){
            return this.triggerMethod('errors', arguments);
        };

        /**
         * Section for work with requests
         * */
        this.request = {
            /* @this AHChat */
            auth: function(token, name, profile, myId){
                var data = {};
                if(token){
                    data.token = token;
                }
                if(name){
                    data.name = name;
                }
                if(profile){
                    _.extend(data, profile);
                }
                if(myId){
                    data.id = myId;
                }
                this.callSocket('auth', data);
            },
            /* @this AHChat */
            message: function(msg){
                return this.callSocket('message', msg);
            },
            /* @this AHChat */
            finish: function(chatId){
                return this.callSocket('finish', {chatId: chatId});
            }
        };

        $.extend(this.request, cfg.request || {});

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
                    if(data.chats.length){
                        for(var v in data.chats){
                            if(data.chats.hasOwnProperty(v)) this.addChat(data.chats[v].id, data.chats[v]);
                        }
                    }else{
                        this.$el.find('.auth').addClass('emptyChats');
                    }
                }
                if(data.token){
                    this.setToken(data.token);
                }
                this.openChat();

                this.evt('serverAvailable');
            },
            /* @this AHChat */
            message: function(data){
                if(data.chatId){
                    var chat = this.chats[data.chatId];
                    var render = this.isCurrentChat(chat);
                    if(data.clientDate){
                        chat.accept(data, render);
                    }else{
                        chat.push(data, render);
                    }
                }
            },
            /* @this AHChat */
            chat: function(data){
                this.addChat(data.id, data);
            },
            /* @this AHChat */
            available: function(data){
                if(data.chatId){
                    var chat = this.chats[data.chatId];
                    chat.status = data.available == true;

                    if(chat.status){
                        this.evt('online', chat);
                    }else{
                        this.err('notOnline', chat);
                    }
                }
            },
            /* @this AHChat */
            finish: function(data){
                if(data && data.chatId){
                    var chat = this.chats[data.chatId];
                    if(chat){
                        this.removeChat(chat);
                    }
                }
            },
            /* @this AHChat */
            update: function(data){
                if(data && data.chatId){
                    var chat = this.chats[data.chatId];
                    if(chat && data.status == 'RESPONDED'){
                        this.removeChat(chat);
                    }
                }
            }
        };

        $.extend(this.response, cfg.response || {});

        /**
         * Trigger for response section
         * @see this.response
         * @see this.triggerMethod
         * */
        this.res = function(){
            return this.triggerMethod('response', arguments);
        };

        /**
         * Remove chat
         * @param chat {Chat}
         */
        this.removeChat = function(chat){
            chat.$el.remove();
            delete this.chats[chat.id];
            var count = 0;
            for(var v in this.chats) count++;
            if(!count){
                delete this.currentChat;
                this.$el.addClass('have-not-chat');
            }
        };

        this.reset();
    };

    window.AHChat = AHChat;

    return AHChat;
});