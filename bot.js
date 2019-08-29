"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cron_1 = require("cron");
var moment = require('moment');
var fs = require('fs');
var request = require('request');
var nodeBot = require('telegraf');
var bot = new nodeBot("667639490:AAFBuY8_6zuRsFAbeF5CPQCsLmUn5x_zDV8");
bot.start(function (ctx) {
    console.log(ctx['update']['message']['from']);
    ctx.reply('Welcome');
});
bot.help(function (ctx) { return ctx.reply('Send me a sticker'); });
bot.command('update', function (ctx) {
    if (moment() < moment().hours(8).minutes(0)) {
        //lade von gestern nachmittag
        console.log('reload yesterday');
        Bot.updatePlanYesterday();
    }
    else if (moment() < moment().hours(8).minutes(0)) {
        //lade von heute morgen
        console.log('reload today morning');
        Bot.updatePlanMorning();
    }
    else {
        //lade von heute abend
        console.log('reload today afternoon');
        Bot.updatePlanAfternoon();
    }
    ctx.reply('Verträtungspläne geupdatet');
});
bot.command('heute', function (ctx) {
    Bot.sendPlan(ctx['update']['message']['from']['id'], moment().format('YYYYMMDD'));
});
bot.command('morgen', function (ctx) {
    Bot.sendPlan(ctx['update']['message']['from']['id'], moment().add(1, 'd').format('YYYYMMDD'));
});
bot.command('ubermorgen', function (ctx) {
    Bot.sendPlan(ctx['update']['message']['from']['id'], moment().add(2, 'd').format('YYYYMMDD'));
});
bot.launch();
var Bot = /** @class */ (function () {
    function Bot() {
    }
    Bot.startScripts = function () {
        Bot.startBot();
    };
    /**
     * Lade Vertretungsplan und speichere ihn im Grundpfad
     * @param {boolean} today
     * @param {string} filename
     */
    Bot.loadPlan = function (today, filename) {
        if (filename === void 0) { filename = null; }
        try {
            request({
                uri: 'https://www.kgs-tornesch.de/Vertretungsplan/Online' + (today ? 1 : 2) + '.pdf',
                headers: {
                    'Content-type': 'applcation/pdf',
                    'Authorization': 'Basic S0dTOlRvcm5lc2No'
                },
                encoding: null,
                authorization: {
                    username: 'KGS',
                    password: 'Tornesch'
                }
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    fs.writeFileSync((filename ? filename : (today ? 1 : 2)) + '.pdf', body, 'binary');
                }
                else {
                    console.log(error);
                    console.log(response.statusCode);
                }
            });
        }
        catch (e) {
        }
    };
    /**
     * sende Datei an nutzer
     * @param {number} chatId
     * @param {string} filename
     */
    Bot.sendPlan = function (chatId, filename) {
        try {
            if (fs.existsSync(__dirname + '/' + filename + '.pdf')) {
                bot.telegram.sendDocument(chatId, {
                    source: fs.createReadStream(__dirname + '/' + filename + '.pdf'),
                    filename: filename + '.pdf'
                });
            }
        }
        catch (e) {
        }
    };
    Bot.updatePlanYesterday = function () {
        Bot.loadPlan(true, moment().format('YYYYMMDD'));
        Bot.loadPlan(false, moment().add(1, 'd').format('YYYYMMDD'));
    };
    Bot.updatePlanMorning = function () {
        Bot.loadPlan(true, moment().format('YYYYMMDD'));
        Bot.loadPlan(false, moment().add(1, 'd').format('YYYYMMDD'));
    };
    Bot.updatePlanAfternoon = function () {
        Bot.loadPlan(true, moment().add(1, 'd').format('YYYYMMDD'));
        Bot.loadPlan(false, moment().add(2, 'd').format('YYYYMMDD'));
    };
    Bot.startBot = function () {
        console.log('Cron gestartet');
        new cron_1.CronJob('15 8 * * *', function () {
            Bot.updatePlanMorning();
        }, function () {
            console.log('job is done');
        }, true, 'Europe/Berlin');
        new cron_1.CronJob('15 17 * * *', function () {
            Bot.updatePlanAfternoon();
        }, function () {
            console.log('job is done');
        }, true, 'Europe/Berlin');
    };
    return Bot;
}());
exports.Bot = Bot;
