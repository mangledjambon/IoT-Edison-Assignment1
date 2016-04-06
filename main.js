var mraa = require('mraa');                             //require mraa
console.log('MRAA Version: ' + mraa.getVersion());      //write the mraa version to the console

var ipAddress = '192.168.1.103';
var portNumber = 8080;

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usersArray = [];
var userId;
var soundSensor = new mraa.Aio(2);
var potentiometer = new mraa.Aio(0);                    //setup access analog input A1
var soundSensorValue;
var potentiometerValue;
var led = new mraa.Gpio(3);
led.dir(mraa.DIR_OUT);

function setup() {
    
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/', 'index.html'));
    });

    app.use(express.static(__dirname));
    app.use('/', express.static(__dirname + '/'));


    // Socket.io event handlers
    io.on('connection', function(socket) {
        
        console.log("\nNew User Joined! Welcome user_" + usersArray.length);
        
        if (usersArray.length > 0) {
            var element = usersArray[usersArray.length - 1];
            userId = 'user_' + (parseInt(element.replace("user_", "")) + 1); 
        } else {
            userId = "user_0";
        }
        
        io.emit('user connect', userId);
        usersArray.push(userId);
        console.log('No. of users connected: ' + usersArray.length);
        console.log(usersArray);
        io.emit('connected users', usersArray);
        
        socket.on('user disconnect', function (msg) {
            console.log(msg + " disconnected.");
            usersArray.splice(usersArray.lastIndexOf(msg), 1);
            io.emit('user disconnect', msg);
        });
        
        socket.on('chat message', function(msg) {
            io.emit('chat message', msg);
            console.log('message: ' + msg.value);
        });
        
    });

    http.listen(portNumber, function() {
        console.log('Server active at http://' + ipAddress + ':' + portNumber);
    });
}

function updateSensors() {
    
    led.write(0);
    
    var soundSensorValue = soundSensor.read();
    var potentiometerValue = potentiometer.read();
    
    if (potentiometerValue <= soundSensorValue) {
        io.emit('threshold reached');
        led.write(1);
    }
    
    io.emit('update sensors', soundSensorValue, potentiometerValue);
    //console.log("Updated sensors: S = " + soundSensorValue + ", T = " + potentiometerValue);
    
}

setup();
setInterval(updateSensors, 200);
