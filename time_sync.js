#!/usr/bin/node

"use strict"

const defaultConfig = require("./config.json").timeSyncDefaultConfig;

const http = require("http");
const querystring = require("querystring");

/**
 * It is stolen insolently from https://github.com/m20-sch57/thetruehat/blob/736474165828c9444f8196229b7ea2c7c616a489/static/main.js
 */

module.exports.TimeSync =
class TimeSync { // TODO: Rewrite for Node.js
    constructor(syncInterval, config={}) {
        this.config = Object.assign(defaultConfig, config);

        this.syncInterval = syncInterval;
        this.delta = 0;

        setInterval(() => this.maintainDelta(), this.syncInterval);
    }

    #log = function (data, level) {
        level = level || "info";
        if (this.config.writeLogs) {
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

    fetch (name, {path, method="GET", headers={}, data = null}) {
        const options = {
            protocol: this.config.protocol,
            hostname: this.config.hostname,
            port: this.config.port,
            path,
            method,
            headers
        };

        switch (method) {
            case "GET":
                options.path += "?" + querystring.stringify(data);
                break;
            case "POST": // Do not forget about "Content-Type".
                if (data !== null) {
                    data = JSON.stringify(data);
                    options.headers["Content-Length"] = Buffer.byteLength(data);
                }
                break;
        }

        return new Promise((resolve, reject) => {
            const req = http.request(options, res => {
                    res.setEncoding("utf8")
                        .on("error", (err) => this.#log(err, "error"))
                        .on("data", (data) => {
                            if (this.config.logs["HTTP-response"]) this.#logResponse(name, data);
                            resolve(data);
                        })
                }
            ).on("error", (e) => reject(e))

            switch (method) {
                case "POST":
                    if (data !== null) req.write(data);
                    break;
            }

            req.end();
        });
    }

    getTime() {
        // return Date.now() + this.delta;
    }

    async getDelta() {
        let response = await this.fetch("getTime", {"path": "/getTime", "headers": {"X-Client-Timestamp": Date.now()}});
        // let now = Date.now();
        // this.delta = response.headers.get("X-Server-Timestamp") * this.config.serverTimeMultiplier + (now - response.headers.get("X-Client-Timestamp")) / 2 - now;
    }

    async maintainDelta() {
        await this.getDelta();
        if (this.config.writeLogs) {
            console.info("New time delta:", this.delta);
            console.info("Diff with local time:", this.getTime() - (new Date()).getTime());
        }
    }
}
