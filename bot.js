"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cron_1 = require("cron");
var moment = require('moment');
var fs = require('fs');
var request = require('request');
var nodeBot = require('telegraf');
var bot = new nodeBot("667639490:AAFBuY8_6zuRsFAbeF5CPQCsLmUn5x_zDV8");
bot.start(function (ctx) {
    console.log(ctx['update']['message']['from']['id']);
    ctx.reply('Welcome');
});
bot.help(function (ctx) { return ctx.reply('Hilfe noch nicht verfügbar'); });
//check if new plans are online and send updated plan(s)
bot.command('update', function (ctx) {
    Bot.updatePlan().then(function (update) {
        ctx.reply(update ? 'Vertretungspläne geupdatet' : 'Vertretungspläne bereits aktuell');
        if (update == 3 || update == 2) {
            Bot.sendPlan(ctx['update']['message']['from']['id'], false);
        }
        if (update == 3 || update == 1) {
            Bot.sendPlan(ctx['update']['message']['from']['id'], true);
        }
    });
});
//send plan 1 from storage
bot.command('1', function (ctx) {
    Bot.sendPlan(ctx['update']['message']['from']['id'], true);
});
//send plan 2 from storage
bot.command('2', function (ctx) {
    Bot.sendPlan(ctx['update']['message']['from']['id'], false);
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
     */
    Bot.loadPlan = function (today) {
        return new Promise(function (res, rej) {
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
                    var file = (today ? 1 : 2) + '.pdf';
                    fs.writeFileSync(file, body, 'binary');
                    var filesize = Bot.getFilesizeInBytes(file);
                    if (fs.existsSync(file) && ((today && Bot.filesizeToday == filesize) || (!today && Bot.filezizeTomorow == filesize))) {
                        console.log('Datei wurde nicht aktuallisiert (bereits vorhanden)');
                        res(false);
                    }
                    else {
                        console.log('update file ' + file + ' (' + filesize + ')');
                        today ? Bot.filesizeToday = filesize : Bot.filezizeTomorow = filesize;
                        res(true);
                    }
                }
                else {
                    console.log(error);
                    rej();
                }
            });
        });
    };
    Bot.getFilesizeInBytes = function (filename) {
        if (!fs.existsSync(filename)) {
            return 0;
        }
        var stats = fs.statSync(filename);
        return stats.size;
    };
    /**
     * sende Datei an nutzer
     * @param {number} chatId
     * @param today
     */
    Bot.sendPlan = function (chatId, today) {
        try {
            if (fs.existsSync(__dirname + '/' + (today ? 1 : 2) + '.pdf')) {
                bot.telegram.sendDocument(chatId, {
                    source: fs.createReadStream(__dirname + '/' + (today ? 1 : 2) + '.pdf'),
                    filename: (today ? 1 : 2) + '.pdf'
                });
            }
        }
        catch (e) {
        }
    };
    /**
     * 3: beide
     * 2: nur 2
     * 1: nur 1
     * 0: keiner
     */
    Bot.updatePlan = function () {
        return __awaiter(this, void 0, void 0, function () {
            var one, two;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Bot.loadPlan(true)];
                    case 1:
                        one = _a.sent();
                        return [4 /*yield*/, Bot.loadPlan(false)];
                    case 2:
                        two = _a.sent();
                        return [2 /*return*/, (one || two) ? ((one && two) ? 3 : (one ? 1 : 2)) : 0];
                }
            });
        });
    };
    Bot.startBot = function () {
        console.log('Cron gestartet');
        new cron_1.CronJob('0,15,30,45 7-8,16-18 * * *', function () {
            Bot.updatePlan().then(function (update) {
                //todo send to all users with activated updates
                // if (update == 3 || update == 2) {
                //     Bot.sendPlan(ctx['update']['message']['from']['id'], false);
                // }
                // if (update == 3 || update == 1) {
                //     Bot.sendPlan(ctx['update']['message']['from']['id'], true);
                // }
            });
        }, function () {
        }, true, 'Europe/Berlin');
    };
    return Bot;
}());
exports.Bot = Bot;
