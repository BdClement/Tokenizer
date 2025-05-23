$(document).ready(function() {
    // const roomName = JSON.parse(document.getElementById('room-id').textContent);
    const roomId = JSON.parse($('#room-id').text());
    const scrollable_container = $('#list_messages');

    // Creer une connexion WebSocket a l'entree dans la Room
    const chatSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/chat/'
        + roomId
        + '/'
    );

    chatSocket.onopen = function(e) {
        console.log(`Connection bien etabli pour la room ${roomId}`);
    };

    chatSocket.onerror = function(error) {
        console.log(`Error == ${error}`);
    };

    chatSocket.onmessage = function(e) {
        console.log("onmessage called");
        const data = JSON.parse(e.data);
        const eventType = data.type;
        
        if (eventType === "chat_message") {
            // Faire des fonctions pour chaque cas ?
            $('#chat-log').append(`<li class="m-1 text-end list-group-item bg-light">${data.author} : ${data.message}</li>`);
            scrollToBottom();
        }
        else if (eventType === "user_connection") {
            $('#chat-log').append(`<li class="m-1 list-group-item bg-secondary text-white text-start">${data.author} ${data.message}</li>`);
            scrollToBottom();
        }
        else if (eventType === "list_connected_users") {
            let content_users_connected = '';
            // console.log(data.users_connected)
            for (let user of data.users_connected) {
                content_users_connected += `<li class="list-group-item bg-secondary text-white text-center">${user}</li>\n`
            }
            $('#users-connected').html(content_users_connected)       
        }
        else {
            console.error("Aucun des event recu dans onmessage ");
        }
    };

    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
    };

    // Place le curseur au chargement de la page dans l'input
    $('#chat-message-input').focus();
    // Regarde les key du clavier qui sotn presse pour autoriser Enter pour submit le message 
    $('#chat-message-input').on('keyup', function(e) {
        if (e.key === 'Enter') {
            $('#chat-message-submit').click();
        }
    })

    // recupere le contenu de l'input au submit et on l'envoie a la websocket 
    $('#chat-message-submit').on("click", function() {
        const messageInputDom = $('#chat-message-input');
        const message = messageInputDom.val();
        chatSocket.send(JSON.stringify({
            'type': 'chat_message',
            'message': message
        }));
        messageInputDom.val('');
    });

    // Function to put the scroll down to see last messages
    // Appeler lors d'un message recu ou d'une connexion (donc au chargement de la page aussi)
    function scrollToBottom() {
        // scrollTop et scrollHeight sont des proprietés d'elem du Dom qui ont la propriete overlow
        scrollable_container.scrollTop(scrollable_container[0].scrollHeight);
        // console.log("Appel a scrollToBottom")
    };
});





