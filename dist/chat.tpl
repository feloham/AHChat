<div class="ah-chat">
    <div class="window">
        <div class="heading">
            <a class="sellerName">Авторизация</a>
            <button class="close-window"></button>
        </div>
        <div class="panel">
            <div class="error"></div>
            <div class="auth">
                <p class="notOnline">Продавец в данный момент не в сети, пожалуйста попробуйте позднее...</p>
                <p class="unavailable">Извините, чат в данный момент не доступен.<br>Попытка соединения...</p>
                <p>Пожалуйста<br> введите Ваше имя</p>
                <div class="wrap">
                    <input type="text">
                </div>
                <button class="auth-btn">Начать</button>
            </div>
            <div class="chat nano">
                <div class="messages nano-content"></div>
            </div>
        </div>
        <div class="footer">
            <div class="textInp">
                <div class="msg-text" contenteditable="true" placeholder="Введите сообщение..."></div>
                <button class="send-btn"><i class="icon"></i></button>
            </div>
        </div>
    </div>
    <div class="chats">
        <div class="heading">
            <a>Список разговоров</a>
            <button class="close-window"></button>
        </div>
        <div class="empty-list">
            <p>
                У Вас еще нет диалогов
            </p>
        </div>
        <div class="list"></div>
    </div>
    <div class="fixed-btn">
        <a class="chats-btn"><i class="icon"></i>Разговоры <span class="new-messages"></span></a>
        <a class="open-btn"><i class="icon"></i>Написать сообщение</a>
    </div>
    <!-- Template of message -->
    <div id="messageTpl">
        <div class="message">
            <div class="text"></div>
            <span class="date"></span>
        </div>
    </div>
    <!-- Template of chat item -->
    <div id="chatTpl">
        <div class="chat">
            <a></a><span class="status"></span>
            <p></p>
        </div>
    </div>
</div>