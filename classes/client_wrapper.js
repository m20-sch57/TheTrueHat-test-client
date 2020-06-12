#!/usr/bin/node

"use strict"

module.exports.Wrapper=
class Wrapper {
    constructor({clientClass, roomKey, usersNumber, username, webConfigs = {}, clientConfigs = {}}) {
        this.client = new clientClass({username, webConfigs, clientConfigs});

        this.roomKey = roomKey;
        this.usersNumber = usersNumber;
        this.username = username;

        this.client.web.ONsPlayerJoined((data) => {
            if (data.host === this.username &&
                data.playerList.filter((user) => user.online).length === this.usersNumber) {
                this.client.startGame();
            }
        })

        this.client.web.ONsPlayerLeft((data) => {
            if (data.host === this.username &&
                data.playerList.filter((user) => user.online).length === this.usersNumber) {
                this.client.startGame();
            }
        })

        this.client.web.ONsGameEnded(() => {
            process.exit();
        })

        this.client.joinRoom(roomKey);
    }
}

