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

const http = require("http");
const querystring = require("querystring");
const io = require("socket.io-client");

class WebClient {
    constructor() {
        this.gameLog = [];

        this.socket = io.connect(window.location.origin, {"path": window.location.pathname + "socket.io"}); // TODO: Rewrite paths.

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

    #logRequest (request, data) {
        let level = "info";
        this.#log({
            "event": {"type": "HTTP", "name": request},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    #logServerSignal (event, data) {
        let level = "info";
        if (event === "sFailure") level = "warn";
        this.#log({
            "event": {"type": "Server-Socket", "name": event},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    #logClientSignal (event, data) {
        let level = "info";
        this.#log({
            "event": {"type": "Client-Socket", "name": event},
            data,
            // "time": timeSync.getTime(), // TODO: Rewrite
            // "humanTime": (new Date(timeSync.getTime()).toISOString())
        }, level);
    }

    fetch ({path, method="GET", headers={}, data = null}) {
        this.#logRequest("...", {}); // TODO: Implementation
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
                options.headers["Content-Length"] = Buffer.byteLength(data);
                break;
        }

        return new Promise((resolve, reject) => {
            const req = http.request(options, res => {
                res.setEncoding("utf8")
                    .on("error", (err) => reject(err))
                    .on("data", (data) => resolve(data))
            }
            ).on("error", (e) => reject(e))

            switch (method) {
                case "POST":
                    req.write(JSON.stringify(data));
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
        this.fetch({path: "/api/getRoomInfo"});
    }

    /**Implementation of getFreeKey
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     */
    getFreeKey () {
        this.fetch({path: "/api/getFreeKey"});
    }

    /**Implementation of getDictionaryList
     * @see https://github.com/m20-sch57/thetruehat/blob/master/docs/main.md
     *
     */
    getDictionaryList () {
        this.fetch({path: "/api/getDictionaryList"});
    }

    postFeedback (feedback) {
        this.fetch({
            path: "/feedback",
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            data: feedback
        })
    }

    emit(event, data) {
        this.socket.emit(event, data);
        this.#logClientSignal(event, data);
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

class Application {
    constructor() {
        this.client = new WebClient();

    }
}