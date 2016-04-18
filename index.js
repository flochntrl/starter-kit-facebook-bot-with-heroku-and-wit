'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const Wit = require('node-wit').Wit;

// Webserver parameter
const PORT = process.env.PORT || 5000;

// Wit.ai parameters
const WIT_TOKEN = "4YKLYVNWTL2DG2HPWTDX4LKNC5DZXUW7";

// Messenger API parameters
const FB_PAGE_ID = "216186221848981" && Number("216186221848981");
if (!FB_PAGE_ID) {
    throw new Error('missing FB_PAGE_ID');
}
const FB_PAGE_TOKEN = "CAADLHsVnmpoBADdMaPIzyCUm1Jc9AcnK677v2WJQKjdHj1NGlSlUWBAUh8MOVBIrNqAtcYVlzvVXPH08ODqjSEHhvgZCuDsZCl6iWQbidgXe882f42YnrlxLiRLKtHR8CniJtweaSTXmWovtYn6ZArZCeblzHQbwCjJCDrfbh5E2zqkMAHKoVDArXDQOCroZD";
if (!FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN');
}
const FB_VERIFY_TOKEN = "afbc5f280479fc8e69794302844064f6ab70e42292962dc6f9df2a47581ed14c";

// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const fbReq = request.defaults({
    uri: 'https://graph.facebook.com/me/messages',
    method: 'POST',
    json: true,
    qs: {access_token:FB_PAGE_TOKEN, appsecret_proof: FB_VERIFY_TOKEN},
    headers: {'Content-Type': 'application/json'}
});

const fbMessage = function(recipientId, msg, cb) {
    const opts = {
        form: {
            recipient: {
                id: recipientId
            },
            message: {
                text: msg
            }
        }
    };
    fbReq(opts, function(err, resp, data) {
        if (cb) {
            cb(err || data.error && data.error.message, data);
        }
    });
};

// See the Webhook reference
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
const getFirstMessagingEntry = function(body) {
    const val = body.object == 'page' &&
            body.entry &&
            Array.isArray(body.entry) &&
            body.entry.length > 0 &&
            body.entry[0] &&
            body.entry[0].id == FB_PAGE_ID &&
            body.entry[0].messaging &&
            Array.isArray(body.entry[0].messaging) &&
            body.entry[0].messaging.length > 0 &&
            body.entry[0].messaging[0]
        ;
    return val || null;
};

// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = function(fbid) {
    var sessionId;
    // Let's see if we already have a session for the user fbid
    Object.keys(sessions).forEach(function(k) {
        if (sessions[k].fbid === fbid) {
        // Yep, got it!
        sessionId = k;
    }
});
    if (!sessionId) {
        // No session found for user fbid, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = {fbid: fbid, context: {}};
    }
    return sessionId;
};

// Our bot actions
const actions = {
        say: function(sessionId, context, message, cb) {
        // Our bot has something to say!
        // Let's retrieve the Facebook user whose session belongs to
        const recipientId = sessions[sessionId].fbid;
if (recipientId) {
    // Yay, we found our recipient!
    // Let's forward our bot response to her.
    fbMessage(recipientId, message, function(err, data) {
        if (err) {
            console.log(
                'Oops! An error occurred while forwarding the response to',
                recipientId,
                ':',
                err
            );
        }

        // Let's give the wheel back to our bot
        cb();
});
} else {
    console.log('Oops! Couldn\'t find user for session:', sessionId);
    // Giving the wheel back to our bot
    cb();
}
},
merge: function(sessionId, context, entities, message, cb) {
    cb(context);
},
error: function(sessionId, context, error) {
    console.log(error.message);
},
// You should implement your custom actions here
// See https://wit.ai/docs/quickstart
};

// Setting up our bot
const wit = new Wit(WIT_TOKEN, actions);

// Starting our webserver and putting it all together
const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());

// Webhook setup
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'powerful-castle-token-webhook') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Message handler
app.post('/webhook/', function (req, res) {
    // Parsing the Messenger API response
    const messaging = getFirstMessagingEntry(req.body);
if (messaging && messaging.message && messaging.recipient.id === FB_PAGE_ID) {
    // Yay! We got a new message!

    // We retrieve the Facebook user ID of the sender
    const sender = messaging.sender.id;

    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    const sessionId = findOrCreateSession(sender);

    // We retrieve the message content
    const msg = messaging.message.text;
    const atts = messaging.message.attachments;

    if (atts) {
        // We received an attachment

        // Let's reply with an automatic message
        fbMessage(
            sender,
            'Sorry I can only process text messages for now.'
        );
    } else if (msg) {
        // We received a text message

        // Let's forward the message to the Wit.ai Bot Engine
        // This will run all actions until our bot has nothing left to do
        wit.runActions(
            sessionId, // the user's current session
            msg, // the user's message
            sessions[sessionId].context, // the user's current session state
            function (error, context) {
            if (error) {
                console.log('Oops! Got an error from Wit:', error);
            } else {
                // Our bot did everything it has to do.
                // Now it's waiting for further messages to proceed.
                console.log('Waiting for futher messages.');

        // Based on the session state, you might want to reset the session.
        // This depends heavily on the business logic of your bot.
        // Example:
        // if (context['done']) {
        //   delete sessions[sessionId];
        // }

        // Updating the user's current session state
        sessions[sessionId].context = context;
    }
    }
    );
    }
}
res.sendStatus(200);
});