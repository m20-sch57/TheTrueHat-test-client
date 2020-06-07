#!/usr/bin/node

"use strict"

const WebClient = require("./web_API").WebClient;

module.exports.ClientManager =
class ClientManager {
    constructor ({webDefaultConfigs = {}, clientDefaultConfigs = {}}) {
        this.webDefaultConfigs = Object.assign({"writeLogs": false}, webDefaultConfigs);
        this.clientDefaultConfigs = clientDefaultConfigs;

        this.web = new WebClient(Object.assign(webDefaultConfigs, {"writeLogs": false}));

        this.rooms = {}
    }

    async newRoom ({number, clientClass, clientConfigs = {}, webConfigs = {}, key = null}) {
        if (key === null) key = JSON.parse(await this.web.getFreeKey()).key;

        if (number < 2) {
            console.error("Низя меньше двух игроков :(")
            return;
        }

        if (key in this.rooms) {
            console.error("Ключ юзаный!")
            return;
        }

        this.rooms[key] = [];
        let nextClient;

        for (let i = 0; i < number; i++) {
            nextClient = new clientClass(
                {
                    username: "Test" + (i + 1),
                    clientConfigs: Object.assign(this.clientDefaultConfigs, clientConfigs),
                    webConfigs: Object.assign(this.webDefaultConfigs, webConfigs),
                    gameEndTrigger: i !== 0 ? () => {} : () => this.deleteRoom(key)
                }
                );
            this.rooms[key].push(nextClient);
            nextClient.joinRoom(key);
        }

        return key
    }

    startGame (key) {
        if (!(key in this.rooms)) {
            console.error("А что запускать? (Комнаты такой у меня нет.)")
            return;
        }

        for (let client of this.rooms[key]) client.startGame();
    }

    deleteRoom (key) {
        if (!(key in this.rooms)) {
            console.error("А что запускать? (Комнаты такой у меня нет.)")
            return;
        }

        for (let client of this.rooms[key]) {
            client.web.socket.disconnect();
        }

        delete this.rooms[key];
    }
}