var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var Wit = require('node-wit').Wit;

// Webserver parameter
var PORT = process.env.PORT || 5000;

// Wit.ai parameters
var WIT_TOKEN = process.env.WIT_TOKEN;
if (!WIT_TOKEN) {
    throw new Error('missing WIT_TOKEN');
}

// Messenger API parameters
var FB_PAGE_ID = process.env.FB_PAGE_ID && Number(process.env.FB_PAGE_ID);
if (!FB_PAGE_ID) {
    throw new Error('missing FB_PAGE_ID');
}

var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN');
}

var APP_SECRET_PROOF = process.env.APP_SECRET_PROOF;
if (!APP_SECRET_PROOF) {
    throw new Error('missing APP_SECRET_PROOF');
}

var VERIFY_TOKEN = process.env.VERIFY_TOKEN;
if (!VERIFY_TOKEN) {
    throw new Error('missing VERIFY_TOKEN');
}

// Messenger API specific code

var fbReq = request.defaults({
    uri: 'https://graph.facebook.com/me/messages',
    method: 'POST',
    json: true,
    qs: {access_token:FB_PAGE_TOKEN, appsecret_proof: APP_SECRET_PROOF},
    headers: {'Content-Type': 'application/json'}
});

var fbMessage = function(recipientId, msg, cb) {
    var opts = {
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
var getFirstMessagingEntry = function(body) {
    var val = body.object == 'page' &&
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
var sessions = {};

var findOrCreateSession = function(fbid) {
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
var actions = {
        say: function(sessionId, context, message, cb) {
            // Our bot has something to say!
            // Let's retrieve the Facebook user whose session belongs to
            var recipientId = sessions[sessionId].fbid;
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
        }
        // You should implement your custom actions here
        // See https://wit.ai/docs/quickstart
};

// Setting up our bot
var wit = new Wit(WIT_TOKEN, actions);

// Starting our webserver and putting it all together
var app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());

// Webhook setup
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
});

// Message handler
app.post('/webhook/', function (req, res) {
    // Parsing the Messenger API response
    var messaging = getFirstMessagingEntry(req.body);

    if (messaging && messaging.message && messaging.recipient.id === FB_PAGE_ID) {
        // Yay! We got a new message!

        // We retrieve the Facebook user ID of the sender
        var sender = messaging.sender.id;

        // We retrieve the user's current session, or create one if it doesn't exist
        // This is needed for our bot to figure out the conversation history
        var sessionId = findOrCreateSession(sender);

        // We retrieve the message content
        var msg = messaging.message.text;
        var atts = messaging.message.attachments;

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