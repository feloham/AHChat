# AH Chat

Web chat for client - seller scheme. Seller might have many chats, client only one with seller.
Chat work to `websocket`, for server recommended use https://packagist.org/packages/alexboo/websocket-handler.

## Client authorization
For authorization you must have token and seller id, both parameters you must get from server.
Seller id always required for clients.
If you have'nt token you must input your name, after send name to server, server must return `token` and `chatId`.
Token will be remembered to `localStorage`, and after page reload will be automatically used for auth.
After authorization will opened form to chat with seller.

```js
require(["ahchat"], function(AHChat){
        var chat = new AHChat({
            sellerId: 10,
            //token: 'iofh3498hwe',
            url: 'ws://localhost:8001'
        });
        chat.initialize();
    });
```

## Seller authorization
For authorization as seller you must have id and token, both parameters always required.
To this request server will return your name and chats.
After authorization will render list with active chats, you can click to chat and will opened form.

```js
require(["ahchat"], function(AHChat){
        var chat = new AHChat({
            id: 10,
            token: 'iofh3498hwe',
            url: 'ws://localhost:8001'
        });
        chat.initialize();
    });
```

## Server realization (nodejs)
For server realization you can see `dist/server/index.js`


### Server response example
```
{
"command": "auth", 
"data": {"token": "gi34u3"}, 
"error": "USER_IS_NOT_SELLER"
}
```

### Client request example
```
{
"command": "auth", 
"data": {"name": "shoom"}
}
```

### Chats list example
```
{
    name: 'Shooom3301',
    chats: {
        1: {
            chatter: 'shoom 1',
            messages: [
                {id: 1,text: '3w4t4t33',date: 1447933383,my: true},
                {id: 2,text: 'dfgdfgd',date: 1447233383}
            ]
        },
        2: {
            chatter: 'shoom 2',
            messages: [
                {id: 1,text: '2222222',date: 1447933383},
            ]
        }
    }
}
```


## Options

`url` - url to websocket. Example: `ws://localhost:8001`

`sellerId` - id of seller (when you as client). Example: `12`

`id` - your id (when you as seller). Example: `24`

`token` - string for authorization. Example: `5`

`template` - path to chat template. Example: `html/my/chat.tpl`, default: `dist/chat.tpl`

## Client requests

### auth: authorization
   `token` - key of existing session, always required only for seller
   
   `name` - string of client name, required for anonymous clients
   
   `sellerId` - id of seller, always required for clients
   
   `id` - your id if you seller, always required
   
### message: new message
   `text` - text of message, required
   
   `clientDate` - timestamp of message send time, required
   
   `chatId` - id of chat, will be gived from auth response, required
   
   `my` - boolean, my or not my message, required
  
   
## Server responses

### auth: authorization
   `token` - see client request
   
   `name` - will return if request have token
   
   `chats` - array of chats, for client always one chat
   
### message: new message
   `text` - see request
   
   `date` - timestamp of message
   
   `chatId` - id of chat
   
   `id` - id of message
   
   `my` - of message is your
   
   `clientDate` - returned as a confirmation of the request
   
### status: change status of chatter
   `status` - boolean, true = online, false - offline, its status of chatter
   
   `chatId` - id of chat
   
### chat: new chat
   `id` - id of new chat
   
   `chatter` - name of new chatter
   

## Server errors

#### CHAT_NOT_FOUND
Chat is not found (usually to message request)

#### USER_IS_NOT_ONLINE
User is not online (usually to message request)

#### USER_IS_NOT_SELLER
User cant been authorized as seller (usually to authorization request)

#### USER_NOT_FOUND
User token not found, if clent have token in localStorage him will be removed

#### CHAT_ID_IS_REQUIRED
If message request have'nt chat id

#### TEXT_IS_REQUIRED
If message request have'nt text

#### DATE_IS_REQUIRED
If message request have'nt clientDate