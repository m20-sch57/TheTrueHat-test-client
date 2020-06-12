#!/usr/bin/node

"use strict"

const argv = require("yargs")
    .argv;

const QS = require("querystring")
const TP = require("./classes/true_client").TruePlayer;

const wrap = new (require("./classes/client_wrapper").Wrapper)(
    {
        clientClass: TP,
        roomKey: argv.key,
        usersNumber: argv.num,
        username: argv.name,
        webConfigs: {
            // protocol: "https:",
            // hostname: "m20-sch57.site",
            // path: "",
            // port: 3005,
            writeLogs: argv.logging === true
        },
        clientConfigs: {
            // reactionTime: 1000,
            // minExplTime: 3000,
            // maxExplTime: 5000
        }
    });

if (argv.link === true) {
    console.log(wrap.username + " @ " + wrap.client.web.config.protocol + "//" +
                                        wrap.client.web.config.hostname + ":" +
                                        wrap.client.web.config.port +
                                        wrap.client.web.config.path + "/#" +
                                        QS.escape(argv.key));
}
