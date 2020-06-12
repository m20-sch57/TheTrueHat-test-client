#!/usr/bin/node

"use strict"

const argv = require("yargs")
    .argv;

const TP = require("./classes/true_client").TruePlayer;

new (require("./classes/client_wrapper").Wrapper)(
    {
        clientClass: TP,
        roomKey: argv.key,
        usersNumber: argv.num,
        username: argv.name,
        webConfigs: {
            // protocol: "https:",
            // hostname: "m20-sch57.site",
            // path: "",
            // port: 3005
        },
        clientConfigs: {
            // reactionTime: 1000,
            // minExplTime: 3000,
            // maxExplTime: 5000
        }
    });
