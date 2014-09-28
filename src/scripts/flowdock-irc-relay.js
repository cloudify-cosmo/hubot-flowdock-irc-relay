// TODO: MUCH better logging

var irc = require('irc');
var flowdock = require('flowdock');
var async = require('async');

var fdEmail = process.env.HUBOT_FLOWDOCK_LOGIN_EMAIL;
var fdPwd = process.env.HUBOT_FLOWDOCK_LOGIN_PASSWORD;
var fdFlowId = process.env.HUBOT_FLOWDOCK_IRC_FLOWID;
var ircChannel = process.env.HUBOT_FLOWDOCK_IRC_CHANNEL;
var ircServer = process.env.HUBOT_FLOWDOCK_IRC_SERVER;
var relayUser = process.env.HUBOT_FLOWDOCK_IRC_RELAY_CLIENT;
var relayErrors = true;

var fdUsers = {};
var clients = {};

var fds = new flowdock.Session(fdEmail, fdPwd);

module.exports = function(robot) {

    console.log('fdEmail: ' + fdEmail);
    console.log('fdPwd: ' + fdPwd);
    console.log('fdFlowId: ' + fdFlowId);
    console.log('ircChannel: ' + ircChannel);
    console.log('ircServer: ' + ircServer);
    console.log('relayUser: ' + relayUser);

    // TODO: make this check for new users periodically
    async.waterfall(
        [
            function (callback) {
                fds.flows(function (err, flows) {
                    flows.map(function (flow) {
                        if (flow.id === fdFlowId) {
                            callback(null, flow);
                        }
                    });
                });
            },

            function (flow, callback) {
                flow.users.forEach(function (user) {
                    fdUsers[user.id] = user.nick;
                });
                callback(null, fdUsers);
            },

            function (users) {
                var u;
                for (u in users) {
                    if (users.hasOwnProperty(u)) {
                        console.log('logging in: ' + users[u]);
                        clients[u] = new irc.Client(ircServer, users[u], {
                            channels: [ircChannel],
                        });
                    }
                }
            }
        ]
    );

    var relayClient = new irc.Client(ircServer, relayUser, {
        channels: [ircChannel],
    });

    if (relayErrors) {
        relayClient.addListener('error', function (message) {
            // use to debug: console.log('error: ', message);
            fds.message(fdFlowId, 'CHANNEL_ERROR: ' + JSON.stringify(message), ['irc_channel_error']);
        });
    }

    relayClient.addListener('message', function (from, to, message) {
        // use to debug: console.log('(' + to + ') ' + from + ': ' + message);
        // TODO: only print message in flow if it doesn't contain the tag
        if (message.indexOf(ircChannel) < 0) {
            fds.message(fdFlowId, '(' + to + ') ' + from + ': ' + message, []);
        }
    });

    var stream = fds.stream(fdFlowId);
    stream.on('message', function (message) {
        // use to debug: console.log('flowdock: ' + JSON.stringify(message, undefined, 2));
        if (message.event === 'message' && message.content.indexOf(ircChannel) < 0) {
            // TODO: verify non-registered user can send messages to channel
            if (clients.hasOwnProperty(message.user)) {
                clients[message.user].say(ircChannel, message.content);
            } else {
                relayClient.say(ircChannel, fdUsers[message.user] + ': ' + message.content);
            }
        }
    });
};