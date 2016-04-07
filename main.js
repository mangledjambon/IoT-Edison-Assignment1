<<<<<<< HEAD
/*
    Networking for Internet of Things Assignment 1
    
    Author:     Sean Breen R00070693
    Date:       Wed 6th April 2016
    
    This application takes sensor values from the Intel Edison board 
    and sends them to a webpage. Multiple users can connect and broadcast
    messages on the webpage also.
    
    Libraries used:
        - MRAA
        - socket.io
        - express.js
        - path
        - http
 */

=======
>>>>>>> 99f4080c6c86e67951d6f8af68601a470c4fddce
var mraa = require('mraa');                             //require mraa
console.log('MRAA Version: ' + mraa.getVersion());      //write the mraa version to the console

var ipAddress = '192.168.1.103';                        // ip address of edison
var portNumber = 8080;                                  // port number to listen on

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usersArray = [];                                    // array to hold user ids
var userId;
var potentiometer = new mraa.Aio(0);                    // setup access to rotary angle sensor using analog input A0
var soundSensor = new mraa.Aio(2);                      // setup access to sound sensor through analog input A2
var led = new mraa.Gpio(3);                             // setup access to led through digital output D3

var soundSensorValue;                                   // variable to hold value read from sound sensor
var potentiometerValue;                                 // variable to hold value read from rotary angle sensor
led.dir(mraa.DIR_OUT);                                  // set direction for led to be out

/*
    Function:       setup
    Inputs:         none
    Outputs:        none
    
    Sets up socket.io server and event handlers.
 */
function setup() {
    
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/', 'index.html'));     // allow express.js to deliver index.html in a browser
    });

    app.use(express.static(__dirname));                             // use files in current directory
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
        
        // user connected
        io.emit('user connect', userId);
        usersArray.push(userId);                                    // add user id to array
        console.log('No. of users connected: ' + usersArray.length);// print number of users currently connected
        console.log(usersArray);                                    // print users array
        io.emit('connected users', usersArray);                     
        
        // user disconnected
        socket.on('user disconnect', function (msg) {
            console.log(msg + " disconnected.");
            usersArray.splice(usersArray.lastIndexOf(msg), 1);
            io.emit('user disconnect', msg);
        });
        
        //user sent a chat message
        socket.on('chat message', function(msg) {
            io.emit('chat message', msg);
            console.log('message: ' + msg.value);
        });
        
    });

    // start http server, begin listening on port number specified above
    http.listen(portNumber, function() {
        console.log('Server active at http://' + ipAddress + ':' + portNumber);
    });
}

/*
    Function:       updateSensors
    Inputs:         none
    Outputs:        none
    
    This function will run periodically and update the sensor value variables
    with new values read from the sensors. It also checks to see if the current 
    sound sensor value is greater than the current threshold value and if it 
    is, it lights the LED 
 */
function updateSensors() {
    
    led.write(0);                                       // turn LED off
    
    var soundSensorValue = soundSensor.read();          // read value from sensor
    var potentiometerValue = potentiometer.read();
    
    if (potentiometerValue <= soundSensorValue) {
        io.emit('threshold reached');
        led.write(1);
    }
    
    io.emit('update sensors', soundSensorValue, potentiometerValue);            // update values in index.html
    //console.log("Updated sensors: S = " + soundSensorValue + ", T = " + potentiometerValue);
    
}

setup();                                                // run setup
setInterval(updateSensors, 200);                        // run updateSensors five times a second
