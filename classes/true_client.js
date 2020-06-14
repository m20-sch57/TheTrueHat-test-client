#!/usr/bin/node

"use strict"

const WebClient = require("./web_API").WebClient;
const defaultConfig = require("./config.json").trueClientDefaultConfig;

module.exports.TruePlayer =
class TruePlayer {
    constructor({username, webConfigs = {}, clientConfigs = {}, gameEndTrigger = () => {}}) {
        this.config = Object.assign(defaultConfig, clientConfigs);

        this.web = new WebClient(webConfigs);

        this.username = username;
        this.roomKey = null;
        this.explNo = 0;

        this.web.ONsYouJoined((data) => {
            this.roomKey = data.key;
            this.explNo = 0;
            if (data.state === "play" && data.substate === "explanation" && data.speaker)
                setTimeout(() => {
                    this.explainRandomly();
                }, this.config.reactionTime)
        })

        this.web.ONsGameStarted((data) => {
            setTimeout(() => {
                if (data.speaker === this.username) this.web.cSpeakerReady();
                if (data.listener === this.username) this.web.cListenerReady();
            }, this.config.reactionTime)
        })

        this.web.ONsNextTurn((data) => {
            setTimeout(() => {
                if (data.speaker === this.username) this.web.cSpeakerReady();
                if (data.listener === this.username) this.web.cListenerReady();
            }, this.config.reactionTime)
        })

        this.web.ONsExplanationEnded((data) => {
            this.explNo ++;
        })

        this.web.ONsNewWord((data) => {
            setTimeout(() => {
                this.explainRandomly();
            }, this.config.reactionTime)
        })

        this.web.ONsWordsToEdit((data) => {
            setTimeout(() => {
                this.web.cWordsEdited(data.editWords);
            }, this.config.reactionTime)
        })

        this.web.ONsGameEnded((data) => {
            // this.leaveRoom();
            gameEndTrigger()
        })

        this.web.ONsFailure((data) => { // TODO: Проверить, что не будет DDOS'а
            switch (data.request) {
                case "cJoinRoom":
                    // this.web.cJoinRoom(key, this.username); // TODO: Инфа неверная, надо поправить
                    break;
                case "cLeaveRoom":
                    this.web.cLeaveRoom();
                    break;
                case "cApplySettings":
                    // this.web.cApplySettings(settings); // TODO: Инфа неверная, надо поправить
                    break;
                case "cStartGame":
                    this.web.cStartGame();
                    break;
                case "cListenerReady":
                    this.web.cListenerReady();
                    break;
                case "cSpeakerReady":
                    this.web.cSpeakerReady();
                    break;
                case "cEndWordExplanation":
                    this.web.cEndWordExplanation("explained");
                    break;
                case "cWordsEdited":
                    // this.web.cWordsEdited(data.editWords); // TODO: Инфа неверная, надо поправить
                    break;
                case "cEndGame":
                    break;
            }
        })
    }

    joinRoom (key) {
        this.web.cJoinRoom(key, this.username);
    }

    leaveRoom () {
        this.web.cLeaveRoom();
        this.roomKey = null;
    }

    applySettings (settings) {
        this.web.cApplySettings(settings);
    }

    startGame () {
        this.web.cStartGame();
    }

    getExplTime () {
        return Math.floor(this.config.minExplTime + (this.config.maxExplTime - this.config.minExplTime) * Math.random());
    }

    explainRandomly () {
        const currentExplNo = this.explNo;
        setTimeout(() => { // TODO: Добавить сценарии ошибок и неугадываний
            if (this.explNo === currentExplNo) {
                this.web.cEndWordExplanation("explained");
            }
        }, this.getExplTime() + this.config.reactionTime)
    }
}
