"use strict"

const WebClient = require("./web_API").WebClient;

class TruePlayer {
    constructor({username, roomKey, webConfigs = {}}) {
        this.web = new WebClient(webConfigs);

        this.username = username;
        this.roomKey = roomKey;
    }

    joinRoom(key) {
        this.web.cJoinRoom(this.username, this.roomKey);
    }


}