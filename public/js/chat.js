const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormButton = document.querySelector('button');
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#message')

//Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options ... Qs = query string... location.search = ?username=abc&room=123
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

//Automatic scroll function
/***************************************************
 * Total height - (How much scroll down + The new message height) = 0 
 * This means you are at the last message
 * If the value is more than 0, you are in the middle of the chat
 * To get the each height and margin, use getComputedStyle, scrollHeight, offsetHeight
****************************************************/
const autoScroll = ()=>{
    // get the last message
    const $newMessage = $messages.lastElementChild;

    // get the last message styles to get the margin and etc..
    const newMessageStyles = getComputedStyle($newMessage);

    // get the margin, then get the last message's height
    const newMessageMargin = parseInt(newMessageStyles.marginBottom); 
    const newMessageHeight = newMessageMargin + $newMessage.offsetHeight

    // get the visible chat-box and message container total height
    const visibleHeight = $messages.offsetHeight;
    const containerHeight = $messages.scrollHeight;

    // how far have I scroll down?
    const scrollHeight = $messages.scrollTop + visibleHeight;

    if((containerHeight - newMessageHeight) <= scrollHeight){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

// join a specific room
socket.emit('join',{username, room}, error=>{
    if(error){
        alert(error)
        location.href = '/';
    }
})

socket.on('message', (message)=>{
    console.log(message)

    // template rendering
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (locationURL)=>{
    console.log(locationURL)

    // template rendering
    const html = Mustache.render(locationTemplate,{
        URL: locationURL.url,
        username: locationURL.username,
        createdAt: moment(locationURL.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", function(e){

    e.preventDefault();

    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    // set up the acknowledgment function after message 
    socket.emit("sendMessage", message, (err)=>{

        if(err){
            return console.log(err)
        }

        //enable
        $messageFormButton.disabled = false;
        $messageFormInput.value = '';
        $messageFormInput.focus()
    })
}); 

$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        alert('Your browser does not support geolocation')
    }

    //disabled 
    $locationButton.setAttribute('disabled', 'disabled')

    // geolocation --- get location info
    navigator.geolocation.getCurrentPosition((location)=>{

        socket.emit('sendLocation', {
            longitude: location.coords.longitude,
            latitude: location.coords.latitude
        }, (message)=>{
            //enable
            $locationButton.disabled = false;

            console.log(message)
        });
    })
})
