#!/usr/bin/node

"use strict"

const defaultConfig = require("./config.json").webDefaultConfig;

const Fetcher = require("@lounres/flex_node_fetch").Fetcher
const io = require("socket.io-client");

module.exports.WebClient =
class WebClient extends Fetcher {
    constructor(config={}) {
        super(Object.assign(defaultConfig, config));

        this.socket = io.connect(this.config.protocol + "//" + this.config.hostname + ":" + this.config.port,
            {"path": "/socket.io"});
    }

    logServerSignal = function (event, data) {
        let level = "info";
        if (event === "sFailure") level = "warn";
        this.log({
            "event": {"type": "Server-Socket", "name": event},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    logClientSignal = function (event, data) {
        let level = "info";
        this.log({
            "event": {"type": "Client-Socket", "name": event},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    /**Implementation of getRoomInfo
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     */
    getRoomInfo (key) {
        return this.fetch("getRoomInfo", {path: "/api/getRoomInfo", data: {key}});
    }

    /**Implementation of getFreeKey
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     */
    getFreeKey () {
        return this.fetch("getFreeKey", {path: "/api/getFreeKey"});
    }

    /**Implementation of getDictionaryList
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     */
    getDictionaryList () {
        return this.fetch("getDictionaryList", {path: "/api/getDictionaryList"});
    }

    postFeedback (feedback) { // TODO: Какие-то беды с FB. Не критично.
        return this.fetch("postFeedback",
            {
                path: "/feedback",
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                data: feedback
            }
        );
    }

    emit(event, data) {
        this.socket.emit(event, data);
        if (this.config.logs["Client-Socket"]) this.logClientSignal(event, data);
    }

    cJoinRoom (key, username) {
        this.emit("cJoinRoom",
        {
            "key": key,
            "username": username,
            "time_zone_offset": (new Date()).getTimezoneOffset() * (-60_000)
            });
    }
    cLeaveRoom () {
        this.emit("cLeaveRoom");
    }
    cApplySettings (settings) {
        this.emit("cApplySettings",
            {
                settings
            });
    }
    cStartGame () {
        this.emit("cStartGame");
    }
    cListenerReady () {
        this.emit("cListenerReady");
    }
    cSpeakerReady () {
        this.emit("cSpeakerReady");
    }
    cEndWordExplanation (cause) {
        this.emit("cEndWordExplanation",
            {
                cause
            });
    }
    cWordsEdited (editWords) {
        this.emit("cWordsEdited",
            {
                editWords
            });
    }
    cEndGame () {
        this.emit("cEndGame");
    }

    on (event, callback) {
        this.socket.on(event, (data) => {
            this.logServerSignal(event, data);
            callback(data);
        });
    }

    ONsPlayerJoined (callback) {
        this.on("sPlayerJoined", callback);
    }

    ONsPlayerLeft (callback) {
        this.on("sPlayerLeft", callback)
    }

    ONsYouJoined (callback) {
        this.on("sYouJoined", callback)
    }

    ONsNewSettings (callback) {
        this.on("sNewSettings", callback)
    }

    ONsFailure (callback) {
        this.on("sFailure", callback)
    }

    ONsGameStarted (callback) {
        this.on("sGameStarted", callback)
    }

    ONsNextTurn (callback) {
        this.on("sNextTurn", callback)
    }

    ONsExplanationStarted (callback) {
        this.on("sExplanationStarted", callback)
    }

    ONsNewWord (callback) {
        this.on("sNewWord", callback)
    }

    ONsWordExplanationEnded (callback) {
        this.on("sWordExplanationEnded", callback)
    }

    ONsExplanationEnded (callback) {
        this.on("sExplanationEnded", callback)
    }

    ONsWordsToEdit (callback) {
        this.on("sWordsToEdit", callback)
    }

    ONsGameEnded (callback) {
        this.on("sGameEnded", callback)
    }
}
