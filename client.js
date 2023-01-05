$(document).ready(function () {
    /*global io*/
    let socket = io();

    // implement a way for your client to listen for this event
    socket.on('user count', function (data) {
      console.log(data);
    });
    // Form submittion with new message in field with id 'm'
    $('form').submit(function () {
      var messageToSend = $('#m').val();

      $('#m').val('');
      return false; // prevent form submit from refreshing page
    });
  });
