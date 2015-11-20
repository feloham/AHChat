<div class="ah-chat">
    <div class="window">
        <div class="heading">
            <a class="sellerName"></a>
            <button class="close-window">x</button>
        </div>
        <div class="panel">
            <div class="auth">
                <p>Пожалуйста введите Ваше имя</p>
                <input type="text">
                <button class="auth-btn">Начать</button>
            </div>
            <div class="chat">
                <div class="messages"></div>
            </div>
        </div>
        <div class="footer">
            <form class="textInp">
                <textarea class="msg-text"></textarea>
                <button class="send-btn">Отправить</button>
            </form>
        </div>
    </div>
    <div class="fixed-btn">
        <div class="chats">
            <div class="heading">Список разговоров</div>
            <div class="list"></div>
        </div>
        <a class="chats-btn">Разговоры</a>
        <a class="open-btn">Открыть чат</a>
    </div>
    <div id="messageTpl">
        <div class="message">
            <div class="text"></div>
            <span class="date"></span>
        </div>
    </div>
    <div id="chatTpl">
        <div class="chat">
            <span class="status"></span>
            <a></a>
        </div>
    </div>
</div>