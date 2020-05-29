"use strict"

const config = require("config.json");
if (config.port !== null) {
    config.domain = config.domainURL + ":" + config.port;
}
const SPEAKER_READY = "Я готов объяснять";
const LISTENER_READY = "Я готов отгадывать";
const EXPLAINED_WORD_STATE = "угадал";
const NOT_EXPLAINED_WORD_STATE = "не угадал";
const MISTAKE_WORD_STATE = "ошибка";

const TIME_SYNC_DELTA = 60000;
const DISCONNECT_TIMEOUT = 5000;

const io = require("socket.io-client");

class HTTPClient {
    /**Implementation of getRoomInfo
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     * @param key
     * @return {Promise<void>}
     */
    static async getRoomInfo (key) {}

    /**Implementation of getFreeKey
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     * @return {Promise<void>}
     */
    static async getFreeKey () {}

    /**Implementation of getDictionaryList
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     * @return {Promise<void>}
     */
    static async getDictionaryList () {}
}

class SocketClient {
    constructor() {
        this.gameLog = [];

        this.socket = io.connect(window.location.origin, {"path": window.location.pathname + "socket.io"});

        for (let event in [
            "sPlayerJoined",
            "sPlayerLeft",
            "sYouJoined",
            "sNewSettings",
            "sFailure",
            "sGameStarted",
            "sNextTurn",
            "sExplanationStarted",
            "sNewWord",
            "sWordExplanationEnded",
            "sExplanationEnded",
            "sWordsToEdit",
            "sGameEnded"]) {
            this.socket.on(event, (data) => this.#logSignal(event, data))
        }
    }

    #log(data, level) {
        level = level || "info";
        this.gameLog.push(data);
        if (config.writeLogs) {
            console[level](data);
        }
    }

    #logSignal(event, data) {
        let level = "info";
        if (event === "sFailure") level = "warn";
        this.#log({event, data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    emit(event, data) {
        this.socket.emit(event, data);
        this.#logSignal(event, data);
    }

    cJoinRoom (key, username) {
        this.emit("cJoinRoom",
        {
            "key": key,
            "username": username
            });
    }
    cLeaveRoom () {
        this.emit("cLeaveRoom");
    }
    cApplySettings (settings) {
        this.emit("",
            {
                "settings": settings
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
    cEndWordExplanation () {
        this.emit("cEndWordExplanation");
    }
    cWordsEdited () {
        this.emit("cWordsEdited");
    }
    cEndGame () {
        this.emit("cEndGame");
    }

    on (event, callback) {
        this.socket.on(event, callback);
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