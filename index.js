var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'powerful-castle-token-webhook') {
        res.send(req.query['hub.challenge']);
    }
});
app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
});

var token = "CAADLHsVnmpoBADdMaPIzyCUm1Jc9AcnK677v2WJQKjdHj1NGlSlUWBAUh8MOVBIrNqAtcYVlzvVXPH08ODqjSEHhvgZCuDsZCl6iWQbidgXe882f42YnrlxLiRLKtHR8CniJtweaSTXmWovtYn6ZArZCeblzHQbwCjJCDrfbh5E2zqkMAHKoVDArXDQOCroZD";


function sendTextMessage(sender, text) {
    messageData = {
        text:text
    };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

//CAADLHsVnmpoBADdMaPIzyCUm1Jc9AcnK677v2WJQKjdHj1NGlSlUWBAUh8MOVBIrNqAtcYVlzvVXPH08ODqjSEHhvgZCuDsZCl6iWQbidgXe882f42YnrlxLiRLKtHR8CniJtweaSTXmWovtYn6ZArZCeblzHQbwCjJCDrfbh5E2zqkMAHKoVDArXDQOCroZD
//ec474466e8e8752a61e22b9de922fa3d

//d843219e679fe788c4ed024a6afcfd1e

//afbc5f280479fc8e69794302844064f6ab70e42292962dc6f9df2a47581ed14c%
/*

curl \
-F 'access_token=CAADLHsVnmpoBADdMaPIzyCUm1Jc9AcnK677v2WJQKjdHj1NGlSlUWBAUh8MOVBIrNqAtcYVlzvVXPH08ODqjSEHhvgZCuDsZCl6iWQbidgXe882f42YnrlxLiRLKtHR8CniJtweaSTXmWovtYn6ZArZCeblzHQbwCjJCDrfbh5E2zqkMAHKoVDArXDQOCroZD' \
-F 'appsecret_proof=fbc5f280479fc8e69794302844064f6ab70e42292962dc6f9df2a47581ed14c%' \
-F 'batch=[{"method":"GET", "relative_url":"me"},{"method":"GET", "relative_url":"me/friends?limit=50"}]' \
https://graph.facebook.com



 curl -ik -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=CAADLHsVnmpoBADdMaPIzyCUm1Jc9AcnK677v2WJQKjdHj1NGlSlUWBAUh8MOVBIrNqAtcYVlzvVXPH08ODqjSEHhvgZCuDsZCl6iWQbidgXe882f42YnrlxLiRLKtHR8CniJtweaSTXmWovtYn6ZArZCeblzHQbwCjJCDrfbh5E2zqkMAHKoVDArXDQOCroZD"

 curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=CAADLHsVnmpoBADdMaPIzyCUm1Jc9AcnK677v2WJQKjdHj1NGlSlUWBAUh8MOVBIrNqAtcYVlzvVXPH08ODqjSEHhvgZCuDsZCl6iWQbidgXe882f42YnrlxLiRLKtHR8CniJtweaSTXmWovtYn6ZArZCeblzHQbwCjJCDrfbh5E2zqkMAHKoVDArXDQOCroZD&appsecret_proof=afbc5f280479fc8e69794302844064f6ab70e42292962dc6f9df2a47581ed14c"

*/