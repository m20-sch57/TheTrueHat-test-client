"use strict"

const config = require("./config.json");

// const SPEAKER_READY = "Я готов объяснять";
// const LISTENER_READY = "Я готов отгадывать";
// const EXPLAINED_WORD_STATE = "угадал";
// const NOT_EXPLAINED_WORD_STATE = "не угадал";
// const MISTAKE_WORD_STATE = "ошибка";
//
// const TIME_SYNC_DELTA = 60000;
// const DISCONNECT_TIMEOUT = 5000;

const http = require("http");
const querystring = require("querystring");
const io = require("socket.io-client");

module.exports.WebClient =
class WebClient {
    constructor() {
        this.gameLog = [];

        this.socket = io.connect(config.protocol + "//" + config.hostname + ":" +config.port,
            {"path": "/socket.io"});
    }

    #log = function (data, level) {
        level = level || "info";
        this.gameLog.push(data);
        if (config.writeLogs) {
            console[level](data);
        }
    }

    #logRequest = function (request, data) {
        let level = "info";
        this.#log({
            "event": {"type": "HTTP-request", "name": request},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    #logResponse = function (response, data) {
        let level = "info";
        this.#log({
            "event": {"type": "HTTP-response", "name": response},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    #logServerSignal = function (event, data) {
        let level = "info";
        if (event === "sFailure") level = "warn";
        this.#log({
            "event": {"type": "Server-Socket", "name": event},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    #logClientSignal = function (event, data) {
        let level = "info";
        this.#log({
            "event": {"type": "Client-Socket", "name": event},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    fetch (name, {path, method="GET", headers={}, data = null}) {
        if (config.logs["HTTP-request"]) this.#logRequest(name, data);
        const options = {
            protocol: config.protocol,
            hostname: config.hostname,
            port: config.port,
            path,
            method,
            headers
        };

        switch (method) {
            case "GET":
                path += "?" + querystring.stringify(data);
                break;
            case "POST": // Do not forget about "Content-Type".
                if (data !== null) options.headers["Content-Length"] = Buffer.byteLength(data);
                break;
        }

        return new Promise((resolve, reject) => {
            const req = http.request(options, res => {
                res.setEncoding("utf8")
                    .on("error", (err) => this.#log(err, "error"))
                    .on("data", (data) => {
                        if (config.logs["HTTP-response"]) this.#logResponse(name, data);
                        resolve(data);
                    })
            }
            ).on("error", (e) => reject(e))

            switch (method) {
                case "POST":
                    if (data !== null) req.write(JSON.stringify(data));
                    break;
            }

            req.end();
        });
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

    postFeedback (feedback) {
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
        if (config.logs["Client-Socket"]) this.#logClientSignal(event, data);
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
        this.socket.on(event, (data) => {
            this.#logServerSignal(event, data);
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
