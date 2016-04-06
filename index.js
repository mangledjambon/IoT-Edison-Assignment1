var socket = io();
var userId = "user";


$('form').submit(function() {
    socket.emit('chat message', {value: $('#m').val(), userId: userId});
    $('#m').val('');
    return false;
});

$("#led-link").on('click', function(e){
    socket.emit('toogle led', {value: 0, userId: userId});
});

socket.on('threshold reached', function() {
    $('#messages').prepend($('<li>Threshold exceeded!</li>'));
});

socket.on('chat message', function(msg) {
    $('#messages').prepend($('<li>'+msg.value+'<span> - '+msg.userId+'</span></li>'));
});

socket.on('connected users', function(msg) {
    $('#user-container').html("");
    for(var i = 0; i < msg.length; i++) {
        //console.log(msg[i]+" )msg[i] == userId( "+userId);
        if(msg[i] == userId)
            $('#user-container').append($("<div id='" + msg[i] + "' class='my-circle'><span>"+msg[i]+"</span></div>"));
        else
            $('#user-container').append($("<div id='" + msg[i] + "' class='user-circle'><span>"+msg[i]+"</span></div>"));
    }
});

socket.on('user connect', function(msg) {
    if(userId === "user"){
        console.log("Client side userId: "+msg);
        userId = msg;
    }
});

socket.on('user disconnect', function(msg) {
    console.log("user disconnect: " + msg);
    var element = '#'+msg;
    console.log(element)
    $(element).remove();
});

socket.on('update sensors', function(sound, thresh) {
    $('#sensors').html($("<li>Sound level: " + sound + "</li>" + "<li>Threshold: " + thresh + "</li>"));
});

window.onunload = function(e) {
    socket.emit("user disconnect", userId);
}
