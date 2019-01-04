"use strict";
var express = require('express');
var fs = require('fs');
var socket = require('socket.io');

var app = express();
var server = app.listen(5000,"0.0.0.0");
var io = new socket(server);

app.use(express.static("node_modules"));
app.use('/static',express.static('public'));
app.use((req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
})

app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/index.html');
});
app.get('/admin',(req,res)=>{
  res.sendFile(__dirname + '/admin.html');
})

var webSockets = {} // userID: webSocket

io.on('connection', function (webSocket) {

  webSocket.on('register',(userID)=>{
    if(!userID){
      log("empty user id")
      return;
    }
    webSockets[userID] = webSocket
    log('registered: '  + userID +  ' in '  +JSON.stringify(Object.getOwnPropertyNames(webSockets)))
  })

  webSocket.on('message', (message)=>{
    var msgObj = message;
    var toUserWebSocket = webSockets[msgObj.userID]
    if (!toUserWebSocket) {
      log('user not registered: ' + msgObj.userID)
      return;
    }
      log('sent to ' + msgObj.userID + ' : '  + JSON.stringify(msgObj))
      toUserWebSocket.send(JSON.stringify(msgObj))
  })

  webSocket.on('msgToUser',(msg)=>{
    var {user,msg} = JSON.parse(msg); 
    if(!user in Object.keys(webSockets)){
      webSocket.emit('log','user '+ user + ' is offline');
      return
    }
    var userSocket = webSockets[user]
    userSocket.emit('message',msg);
  })

  webSocket.on('close', function () {
    delete webSockets[userID]
    log('deleted: ' + userID)
  })
  function log(str){
    console.log(str);
    webSocket.emit('log',str);
  }
})
