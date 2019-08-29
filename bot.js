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
var stream = require('stream');
var readline = require('readline');
var fs = require('fs');
var request = require('request');
var pdf = require('pdf-parse');
var nodeBot = require('telegraf');
var bot = new nodeBot("667639490:AAHDzeKbWi5kWM5vjZHqQ24ZBhc9q15WgTo");
var userFilePath = './user.txt';
var subscriberPath = './subscriber.txt';
var pdfOnePath = './1.pdf';
var pdfTwoPath = './2.pdf';
var jsonOnePath = './1.json';
var jsonTwoPath = './2.json';
bot.start(function (ctx) {
    ctx.reply('Willkommen!\nSieht so aus als würdest du gerne den Vertretungsplan der KGST sehen. \n' +
        'Mit dem Befehlen /1 oder /2 bekommst du den ganzen Plan als PDF.\n' +
        'Wenn du immer automatisch den neuesten zugesendet bekommen willst /subscribe doch einfach.\n' +
        'Wenn du nur die Infos einer bestimmten Klasse haben willst, dann sende die Klasse mit (z.B.: /subscribe 5f)');
});
bot.help(function (ctx) {
    ctx.reply('Der Bot läd die Vertretungspläne von der Webseite der KGST (https://www.kgs-tornesch.de/vetretretungsplan.html). Es besteht kein Anspruch auf Vollständigkeit oder Korrektheit der Daten.');
    ctx.reply('Mit "/1" wird der erste und mit "/2" der zweite Plan geladen. Dabei kann es vorkommen, dass die Pläne noch nicht mit denen der KGST aktuallisiert worden sind. Mit "/update" wird eine aktuallisierung erzwungen.');
    ctx.reply('Der Bot befindet sich in einer noch sehr frühen Phase der Entwicklung. Es kann daher noch zu fehlern kommen, ich bitte dies zu entschuldigen.');
});
//check if new plans are online and send updated plan(s)
bot.command('update', function (ctx) {
    Bot.triggerPlanUpdate().then(function (update) {
        ctx.reply(update ? 'Vertretungspläne geupdatet' : 'Vertretungspläne bereits aktuell');
        if (update == 3 || update == 2) {
            Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false);
        }
        if (update == 3 || update == 1) {
            Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true);
        }
    });
});
bot.command('subscribe', function (ctx) {
    //subscribe to class
    if (ctx['update']['message']['text'].split(' ')[1]) {
        Bot.readFileToArray(subscriberPath).then(function (arr) {
            var content = ctx['update']['message']['from']['id'] + " " + ctx['update']['message']['text'].split(' ')[1];
            if (!arr.includes(content)) {
                fs.appendFileSync(subscriberPath, content + '\n');
                ctx.reply('Sie erhalten nun updates für die Klasse ' + ctx['update']['message']['text'].split(' ')[1]);
            }
            else {
                ctx.reply('Sie sind beriets registriert');
            }
            setTimeout(function () {
                Bot.sendClassUpdateToSubscriber(3, ctx['update']['message']['text'].split(' ')[1], ctx['update']['message']['from']['id']);
            }, 1000);
        });
    }
    //subscribe
    else {
        Bot.readFileToArray(userFilePath).then(function (arr) {
            var content = "" + ctx['update']['message']['from']['id'];
            if (!arr.includes(content)) {
                fs.appendFileSync(userFilePath, content + '\n');
                ctx.reply('Du erhälst nun regemmäßig die neusten Vertretungspläne.');
            }
            else {
                ctx.reply('Sie sind bereits im Verteiler. Wenn sie keine Benachrichtigungen mehr wollen, dann senden sie /unsubscribe');
            }
        });
        setTimeout(function () {
            ctx.reply('Wenn du nur Benachrichtigungen für eine Klasse haben willst, dann senden bitte eine Klasse mit. (Bsp.: "/subscribe 8b")');
            setTimeout(function () {
                Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true);
                Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false);
            }, 500);
        }, 500);
    }
});
bot.command('unsubscribe', function (ctx) {
    // ctx['update']['message']['text'].split(' ')[1]
    ctx.reply('noch nicht verfügbar');
});
//send plan 1 from storage
bot.command('1', function (ctx) {
    Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true);
});
//send plan 2 from storage
bot.command('2', function (ctx) {
    Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false);
});
bot.command('class', function (ctx) {
    if (fs.existsSync(subscriberPath)) {
        var count_1 = 0;
        Bot.readFileToArray(subscriberPath).then(function (arr) {
            arr.forEach(function (data) {
                if ("" + data.split(' ')[0] === "" + ctx['update']['message']['from']['id']) {
                    console.log("Sende Vertretungen f\u00FCr " + data.split(' ')[1] + " an " + ctx['update']['message']['from']['id']);
                    Bot.sendClassUpdateToSubscriber(3, data.split(' ')[1], ctx['update']['message']['from']['id']);
                    count_1++;
                }
            });
            if (!count_1) {
                sendReply();
            }
        });
    }
    else {
        sendReply();
    }
    function sendReply() {
        ctx.reply('Du hast keine Klasse Aboniert.');
        sendSubscribeClassTutorial(ctx);
    }
});
function sendSubscribeClassTutorial(ctx) {
    ctx.reply('Tutorial noch nicht fertig.');
}
function sendSubscribePlanTutorial(ctx) {
    ctx.reply('Tutorial noch nicht fertig.');
}
function sendGetDataNowTutorial(ctx) {
    ctx.reply('Tutorial noch nicht fertig.');
}
bot.launch();
var Bot = /** @class */ (function () {
    function Bot() {
    }
    Bot.startScripts = function () {
        Bot.startBot();
    };
    /**
     * 3: beide
     * 2: nur 2
     * 1: nur 1
     * 0: keiner
     */
    Bot.triggerPlanUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var one, two;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Bot.loadAndSavePdqPlanWhenNecessary(true)];
                    case 1:
                        one = _a.sent();
                        if (one) {
                            Bot.parsePdfPlanToJsonPlanAndSave(true);
                        }
                        return [4 /*yield*/, Bot.loadAndSavePdqPlanWhenNecessary(false)];
                    case 2:
                        two = _a.sent();
                        if (two) {
                            Bot.parsePdfPlanToJsonPlanAndSave(false);
                        }
                        return [2 /*return*/, (one || two) ? ((one && two) ? 3 : (one ? 1 : 2)) : 0];
                }
            });
        });
    };
    /**
     * Lade Vertretungsplan und speichere ihn im Grundpfad
     * @param {boolean} today
     */
    Bot.loadAndSavePdqPlanWhenNecessary = function (today) {
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
                    var file = (today ? pdfOnePath : pdfTwoPath);
                    fs.writeFileSync(file, body, 'binary');
                    var filesize = Bot.getFileSizeInBytes(file);
                    if (fs.existsSync(file) && ((today && Bot.filesizeToday == filesize) || (!today && Bot.filezizeTomorow == filesize))) {
                        console.log('Datei wurde nicht aktuallisiert (bereits vorhanden)');
                        res(false);
                    }
                    else {
                        //todo decide my creation date
                        console.log('update file ' + file + ' (' + filesize + 'bytes)');
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
    /**
     * Wandle Pdj in Text um und erstelle Vertretungsplan als Json
     * @param {boolean} today
     * */
    Bot.parsePdfPlanToJsonPlanAndSave = function (today) {
        var classReg = /([56789]|[1][0123])[a-z]+/g;
        var hourReg = /\d{1,2}( - \d{1,2})*/;
        var kgsReg = /KGS_[0-9]*[a-z]_FuF[0-9]?/;
        var lessons = ['WiPo', 'KR', 'ELZ', 'LRS', 'TGT', 'M-E2', 'DB-ProTab', 'ProTab', 'Hosp0', 'WiPo', 'WPK2-ITM', 'WPK1-TEC1', 'WPK1-TEC3', 'WPK1-WL', 'WPK1-WL', 'Ch-1', 'Ch', 'DAZ-Aufbau', 'DAZ', 'Ku-2', 'Ku', 'Bio', 'Phy', 'Rel', 'Phi', 'NaWi', 'Mu', 'DB-WK', 'Wk', 'DB-M', 'Sp', 'DB-E', 'D', 'M', 'E']; // todo DB-XXX / KGS_5a_FuF
        var roomReg = /[A-Z]\d{3,}(\/\d{3,})?|---|H \(alt\) 3/;
        var removeReg = /\s\(\w{2,3}\)/g;
        var dateReg = /(?<=Online-Ausgabe\s\s)\d{1,2}.\d{1,2}.\s\/\s\w+/;
        return new Promise(function (res, rej) {
            var dataBuffer = fs.readFileSync((today ? pdfOnePath : pdfTwoPath));
            pdf(dataBuffer).then(function (data) {
                var allText = data.text.split('\n');
                var text = [];
                var allClasses = [];
                //find all lines with classes and push classes to array
                allText.forEach(function (el) {
                    el = el.replace(removeReg, '');
                    //match = file row contains a class
                    var match = el.match(classReg);
                    if (match) {
                        //make multi classes to single classes => 5ab -> 5a,5b
                        match.forEach(function (m) {
                            //if class number has multiple class letters
                            var classes = [m];
                            if (m.match(/([56789]|[1][0123])[a-z]{2,}/)) {
                                var classNumber_1 = m.match(/([56789]|[1][0123])/)[0];
                                var classLetters = m.match(/[a-z]/g);
                                classes = classLetters.map(function (x) { return classNumber_1 + x; });
                            }
                            allClasses.push(classes);
                            var hour = el.slice(m.length, el.length).match(hourReg)[0];
                            var lesson = el.match(kgsReg);
                            lesson = lesson ? lesson[0] : lessons.find(function (x) {
                                return el.slice(0, el.match(roomReg) ? el.match(roomReg).index : el.length).includes(x);
                            });
                            var type = el.slice(m.length + hour.length + lesson.length, el.match(roomReg) ? el.match(roomReg).index : el.length);
                            var room = el.match(roomReg) ? el.match(roomReg)[0] : '';
                            text.push({
                                class: classes,
                                //5abcdef6KGS_5a_FuFEntfall--- matcht doppelt? 5abcdef und 5a
                                //'6abdeg5KGS_6a_FuF2Entfall--- genauso
                                hour: hour,
                                lesson: lesson,
                                room: room,
                                type: type,
                                more: el.slice(m.length + hour.length + lesson.length + type.length + room.length, el.length),
                                full: el
                            });
                        });
                    }
                });
                //flatten array https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
                allClasses = [].concat.apply([], allClasses);
                //remove duplicates
                allClasses = allClasses.filter(function (item, pos) {
                    return allClasses.indexOf(item) == pos;
                });
                console.log(data.text.match(dateReg)[0]);
                var obj = {
                    pages: data.numpages,
                    creationDate: data.info['CreationDate'].slice(2, 14),
                    date: data.text.match(dateReg)[0],
                    classes: allClasses,
                    text: text
                };
                // console.log(obj);
                fs.writeFileSync((today ? jsonOnePath : jsonTwoPath), JSON.stringify(obj), 'binary');
                res(obj);
            });
        });
    };
    Bot.triggerSendAllUpdates = function (update) {
        Bot.sendPdfFileUpdateToAllUser(update);
        Bot.sendClassUpdateToAllSubscriber(update);
    };
    /**
     * send updated plans to user
     * @param update
     */
    Bot.sendPdfFileUpdateToAllUser = function (update) {
        if (fs.existsSync(userFilePath)) {
            Bot.readFileToArray(userFilePath).then(function (arr) {
                arr.forEach((function (chatId) {
                    if (update == 3 || update == 2) {
                        Bot.sendPdfPlanToUser(chatId, false);
                    }
                    if (update == 3 || update == 1) {
                        Bot.sendPdfPlanToUser(chatId, true);
                    }
                }));
            });
        }
        else {
            console.error(userFilePath + ' did not exist.');
        }
    };
    /**
     * sende Datei an nutzer
     * @param {number} chatId
     * @param today
     */
    Bot.sendPdfPlanToUser = function (chatId, today) {
        return __awaiter(this, void 0, void 0, function () {
            var filename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filename = today ? pdfOnePath : pdfTwoPath;
                        if (!!fs.existsSync(filename)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Bot.triggerPlanUpdate()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, bot.telegram.sendDocument(chatId, {
                            source: fs.createReadStream(filename),
                            filename: (today ? 1 : 2) + '.pdf'
                        })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * send updated classes to subscriber
     * @param update
     */
    Bot.sendClassUpdateToAllSubscriber = function (update) {
        if (fs.existsSync(subscriberPath)) {
            Bot.readFileToArray(subscriberPath).then(function (arr) {
                arr.forEach(function (user) {
                    Bot.sendClassUpdateToSubscriber(update, user.split(' ')[1], user.split(' ')[0]);
                });
            });
        }
        else {
            console.error(subscriberPath + ' did not exist');
        }
    };
    /**
     * send class update to user
     * @param {number} update
     * @param {string} subscribedClass
     * @param {string} userId
     */
    Bot.sendClassUpdateToSubscriber = function (update, subscribedClass, userId) {
        var data = [];
        if (update == 3 || update == 2) {
            data = data.concat(Bot.formatClassData(false, subscribedClass));
        }
        if (update == 3 || update == 1) {
            data = data.concat(Bot.formatClassData(true, subscribedClass));
        }
        data.forEach(function (x) {
            if (x) {
                bot.telegram.sendMessage(userId, x);
            }
        });
    };
    /**
     * get filesize in bytes
     * @param filename
     */
    Bot.getFileSizeInBytes = function (filename) {
        if (!fs.existsSync(filename)) {
            return 0;
        }
        var stats = fs.statSync(filename);
        return stats.size;
    };
    /**
     * lese die user.txt file in ein array
     */
    Bot.readFileToArray = function (filename) {
        return new Promise(function (res, rej) {
            if (fs.existsSync(filename)) {
                var instream = fs.createReadStream(filename);
                var outstream = new stream;
                var rl = readline.createInterface(instream, outstream);
                var arr_1 = [];
                rl.on('line', function (line) {
                    // process line here
                    arr_1.push(line);
                });
                rl.on('close', function () {
                    // do something on finish here
                    res(arr_1);
                });
            }
            else {
                res([]);
            }
        });
    };
    Bot.formatClassData = function (today, subscribedClass) {
        var filePath = today ? jsonOnePath : jsonTwoPath;
        if (!fs.existsSync(filePath)) {
            console.log(filePath + ' did not exist. Create file...');
            Bot.triggerPlanUpdate();
        }
        var plan = JSON.parse(fs.readFileSync(filePath));
        if (plan.classes.includes(subscribedClass)) {
            var data_1 = [];
            plan.text.forEach(function (x) {
                if (x.class.includes(subscribedClass)) {
                    data_1.push(plan.date + " (" + subscribedClass + ")\n" + x.hour + ". Stunde " + x.lesson + " - " + x.type + "\n" + (x.room === '---' ? '' : 'Raum: ' + x.room) + " " + (x.more ? 'Info: ' + x.more : ''));
                }
            });
            return data_1;
        }
        else {
            return null;
        }
    };
    Bot.startBot = function () {
        console.log('Cron gestartet');
        new cron_1.CronJob('0,15,30,45 7-8,16-18 * * *', function () {
            console.log('Starte CronJob');
            Bot.triggerPlanUpdate().then(function (update) {
                Bot.triggerSendAllUpdates(update);
            });
        }, function () {
        }, true, 'Europe/Berlin');
    };
    return Bot;
}());
exports.Bot = Bot;
