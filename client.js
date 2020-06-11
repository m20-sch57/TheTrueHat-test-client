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
    });
