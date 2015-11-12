'use strict';

// Create the offerings update configuration
// receive new offering message from client
// and send it to HeaderNewOfferingController element just waiting for updates
module.exports = function (io, socket) {

  // Send an offering message to all connected sockets when a message is received; message.content is JSON/offering
  socket.on('offeringMessage', function (message) {
    message.type = 'message';
    message.created = Date.now();
    message.profileImageURL = socket.request.user.profileImageURL;
    message.username = socket.request.user.username;

    // Emit the 'chatMessage' event
    io.emit('offeringMessage', message);
  });
};
