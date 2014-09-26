hubot-flowdock-irc-relay
========================

Sync an IRC channel with a Flowdock flow via Hubot.

This relay server will listen to incoming messages in a flow and a channel and relay them to each other.

It will also immitate an IRC client for each flowdock user in the flow and disguise messages as if they're written by that user.

For now, the relay server defaults to posting its error messages into the flow. This might be changed in the future, but for now, will help with identifying problems.

NOTE: Currently, the users list in the irc channel is updated only upon server initialization. Yes, it's stupid.. but a dynamic update will be implemented soon. If a user is connected to a flow but cannot be found in the channel, a default relay client will be used to relay the messages.

ALSO NOTE: This relay server currently has no real direct dependency in Hubot. That is, Hubot it simply used as an executor.

ALSO ALSO NOTE: This is currently written in javascript, not coffeescript.

### Env Vars

The following environment varaibles must be set:

```shell
    # The Flowdock API token you want to use. This will be the user that relays all messages from the IRC channel and that is used to authenticate vs. Flowdock.
    HUBOT_FLOWDOCK_IRC_API_TOKEN
    # The flowid of the flow to relay (e.g. 080cded7-aeea-446f-a1bb-5f5e09e66f54)
    HUBOT_FLOWDOCK_IRC_FLOWID
    # The IRC channel's name to relay (e.g. #test_irc_channel)
    HUBOT_FLOWDOCK_IRC_CHANNEL
    # The IRC server to use (e.g. irc.freenode.com)
    HUBOT_FLOWDOCK_IRC_SERVER
    # The default relay client to use (e.g. cosmo-admin)
    HUBOT_FLOWDOCK_IRC_RELAY_CLIENT
```

### Getting Started

In your `package.json`, add the following:

    "dependencies": {
        "hubot-flowdock-irc-relay": ">=0.0.3",
    },

And in `external-scripts.json` make sure you have:

    ['hubot-flowdock-irc-relay']

### Usage

Well, since the relay server simply runs in the background, there really is nothing you need to do.

In the future, a server management interface might be added so that you're able to hotswap channels, sign in as specific clients, and more...
