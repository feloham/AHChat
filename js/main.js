/*

Auth response:
{
token: 'iufh34834g03werds',
seller: {name: 'Ivan'}
}

 */

(function(){
    var config = {
        template: 'chat.tpl',
        sellerId: 14,
        url: 'ws://localhost:8001'
    };

    /**
     * Chat class
     * @param cfg {object} configuration
     * */
    var Chat = function(cfg){
        //messages storage
        this.messages = {};
        //buffer of sended messages
        this.messageBuffer = {};
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
        //Name of seller
        this.sellerName = '';

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
                this.setToken(localStorage.getItem('chatToken'));
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
                    var $tpl = this.$el.find('#messageTpl');
                    this.msgTpl = $tpl.html();
                    $tpl.remove();
                    this.el = this.$el.get(0);
                }
            },this));
        };

        /**
         * Binding events to dom elements
         * @see this.bindEvent
         * */
        this.delegateEvents = function(){
            this.bindEvent('.fixed-btn', 'click', 'toggleWindow')
                .bindEvent('.close-window', 'click', 'closeWindow')
                .bindEvent('.auth-btn', 'click', 'authorization')
                .bindEvent('form.textInp', 'submit', 'sendMessage');
            return this;
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
         * Enable chat functionality
         * */
        this.enableChat = function(){
            this.$el.addClass('chat');
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
            /* @this Chat */
            openWindow: function(){
                this.$el.addClass('open');
            },
            /* @this Chat */
            closeWindow: function(){
                this.$el.removeClass('open');
            },
            /* @this Chat */
            toggleWindow: function(){
                this.$el.toggleClass('open');
            },
            /* @this Chat */
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
            /* @this Chat */
            sendMessage: function(e){
                e.preventDefault();
                var $textarea = this.$el.find('.msg-text');
                var text = $textarea.val();
                $textarea.val('');
                return this.msg('send', text);
            },
            /* @this Chat */
            socketOpen: function(){
                // #>2.2.1
                this.req('auth', this.token, this.name, cfg.sellerId);
            },
            /* @this Chat */
            socketMessage: function(res){
                if(res && res.data){
                    var data = JSON.parse(res.data);
                    if(data.command && this.response[data.command]){
                        this.res(data.command, data.data);
                    }
                }
            },
            /* @this Chat */
            socketClose: function(){

            },
            /* @this Chat */
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
            /* @this Chat */
            auth: function(token, name, sellerId){
                var data = {};
                if(token){
                    data.token = token;
                }else{
                    data = {name: name, sellerId: sellerId};
                }
                this.callSocket('auth', data);
            },
            /* @this Chat */
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
            /* @this Chat */
            auth: function(data){
                if(data.token && data.sellerName){
                    this.sellerName = data.sellerName;
                    if(data.name) this.name = data.name;
                    if(data.messages){
                        this.msg('add', data.messages);
                    }
                    // #>2.2.2
                    this.setToken(data.token);
                    this.enableChat();
                }
            },
            /* @this Chat */
            message: function(data){
                if(data.accept){
                    this.msg('accept', data);
                }else{
                    this.msg('push', data);
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

        /**
         * Section for work with messages
         * */
        this.message = {
            /**
             * Rendering of message
             * @param msg {object} message. Example: {id: 1, text: 'hello', date: 3498534321}
             * @this Chat
             * */
            render: function(msg){
                var $el = $(this.msgTpl);
                $el.find('.text').text(msg.text);
                $el.find('.date').text(timestampToDateString(msg.date));
                if(msg.my){
                    $el.addClass('my');
                }
                this.$el.find('.messages').append($el);
                return this;
            },
            /**
             * Add array of messages
             * @param msg {object} message. Example: {id: 1, text: 'hello', date: 3498534321}
             * @this Chat
             * @see this.renderMessage
             * */
            push: function(msg){
                if(msg.id && msg.text && msg.date){
                    this.messages[msg.id] = msg;
                    this.msg('render', msg);
                    return this;
                }
                return false;
            },
            /**
             * Add array of messages
             * @param arr {Array} array of messages
             * @this Chat
             * @see this.push
             * */
            add: function(arr){
                for(var i=0; i<arr.length; i++){
                    this.msg('push', arr[i]);
                }
                return this;
            },
            /**
             * Accepting sended message
             * @param data {object} {id: 1, date: 234234}
             * @this Chat
             * @see this.messageBuffer
             * */
            accept: function(data){
                if(data.id && data.date){
                    var msg = this.messageBuffer[data.date];
                    if(msg){
                        msg.id = data.id;
                        msg.my = true;
                        this.msg('push', msg);
                        delete this.messageBuffer[data.date];
                    }
                    return this;
                }
                return false;
            },
            /**
             * Send message to socket
             * @param text {string} text of message
             * @this Chat
             * @see this.messageBuffer
             * */
            send: function(text){
                if(text){
                    var msg = {
                        text: text,
                        date: parseInt(Date.now()/1000)
                    };
                    this.messageBuffer[msg.date] = msg;
                    this.req('message', msg);
                    return this;
                }
                return false;
            }
        };

        /**
         * Trigger for message section
         * @see this.message
         * @see this.triggerMethod
         * */
        this.msg = function(){
            return this.triggerMethod('message', arguments);
        };
    };

    window.chat = new Chat(config);
    chat.initialize();
})();