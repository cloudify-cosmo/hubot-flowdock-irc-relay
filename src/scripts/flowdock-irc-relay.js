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
var refreshUsersInterval = 10000;
var relayErrors = true;
var fdIdent = '(flowdock) ';
var heartBeatEnabled = process.env.HEARTBEAT_ENABLED;
var heartBeatInterval = process.env.HEARTBEAT_INTERVAL || '86400000';
var heartBeatMessage = process.env.HEARTBEAT_MESSAGE || 'Flowdock-IRC Relay is ALIVE! ALIVE!!! Muhahaha';
var heartBeatFlowId = process.env.HEARTBEAT_FLOWID || fdFlowId;

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

    // aid to get all flows. DEV purposes.
    // fds.flows(function(err, flows) {
    //   var anotherStream, flowIds;
    //   flowIds = flows.map(function(f) {
    //     console.log('id:' + f.id + ' name:' + f.name)
    //   });
    // });

    function relayUsersToIrcClients () {
        async.waterfall(
            [
                // get flow
                function (callback) {
                    fds.flows(function (err, flows) {
                        flows.map(function (flow) {
                            if (flow.id === fdFlowId) {
                                callback(null, flow);
                            }
                        });
                    });
                },

                // create users dict from the flow
                function (flow, callback) {
                    flow.users.forEach(function (user) {
                        fdUsers[user.id] = user.nick;
                    });
                    callback(null, fdUsers);
                },

                // register irc clients for all users found
                function (users) {
                    var u;
                    for (u in users) {
                        // since this runs periodically, only register a new client if it wasn't already registered
                        if (users.hasOwnProperty(u) && !clients.hasOwnProperty(u)) {
                            console.log('logging in: ' + users[u]);
                            clients[u] = new irc.Client(ircServer, users[u], {
                                channels: [ircChannel],
                            });
                        }
                    }
                }
            ]
        );
    };

    function sendHeartBeat () {
        console.log('Sending HeartBeat...')
        fds.message(heartBeatFlowId, heartBeatMessage);
    };

    // send a heartbeat to the flow
    if (heartBeatEnabled) {
        console.log('HeartBeat is enabled. It will be sent every ' + heartBeatInterval / 1000 + ' seconds.')
        setInterval(sendHeartBeat, parseInt(heartBeatInterval));
    };

    // periodically register new clients
    setInterval(relayUsersToIrcClients, refreshUsersInterval);

    // create default relay client
    var relayClient = new irc.Client(ircServer, relayUser, {
        channels: [ircChannel],
    });

    // relay channel errors
    if (relayErrors) {
        relayClient.addListener('error', function (message) {
            fds.message(fdFlowId, 'CHANNEL_ERROR: ' + JSON.stringify(message), ['irc_channel_error']);
        });
    }

    // relay channel messages
    relayClient.addListener('message', function (from, to, message) {
        // echo prevention by checking for identifier
        if (message.indexOf(fdIdent) < 0) {
            fds.message(fdFlowId, '(' + to + ') ' + from + ': ' + message, []);
        }
    });

    // relay flow messages
    var stream = fds.stream(fdFlowId);
    stream.on('message', function (message) {
        // echo prevention by checking for identifier
        if (message.event === 'message' && message.content.indexOf(ircChannel) < 0) {
            if (clients.hasOwnProperty(message.user)) {
                clients[message.user].say(ircChannel, fdIdent + message.content);
            } else {
                // if a flow user isn't registered as an irc client, relay from default client
                relayClient.say(ircChannel, message.content);
            }
        }
    });
};