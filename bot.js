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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var cron_1 = require("cron");
var stream = require('stream');
var readline = require('readline');
var fs = require('fs');
var request = require('request');
var pdf = require('pdf-parse');
var nodeBot = require('telegraf');
var bot = new nodeBot("667639490:AAFviTUYsBW3RM3zHBjfWXgWQ1YjsIkswqc");
var userFilePath = './user.txt';
var subscriberPath = './subscriber.txt';
var pdfOnePath = './1.pdf';
var pdfTwoPath = './2.pdf';
var jsonOnePath = './1.json';
var jsonTwoPath = './2.json';
var logPath = './log.txt';
var plan1Command = 'plan1'; // Aktueller Plan
var plan2Command = 'plan2'; // Nächster Plan
var subscribeClassCommand = 'joinclass'; // Klassenupdates erhalten
var unsubscribeClassCommand = 'leaveclass'; //keine Klassenupdates mehr
var subscribeCommand = 'join'; // Updates erhlten
var unsubscribeCommand = 'leave'; // keine pdates erhlten
var classCommand = 'klasse';
var tutorialCommand = 'anleitung'; // Wie funktioniert das?
var helpCommand = 'hilfe';
var updateCommand = 'update';
var classSelectionFinalAction = '';
var classes = {
    '5': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '6': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '7': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    '8': ['a', 'b', 'c', 'd', 'e', 'f'],
    '9': ['a', 'b', 'c', 'd', 'e', 'f'],
    '10': ['a', 'b', 'c', 'd', 'e', 'g'],
    '11': ['a', 'b', 'c'],
    '12': ['a', 'b', 'c'],
    '13': ['a', 'b', 'c', 'd'],
    'DAZ': ['-Klasse', '-Aufbau'],
};
log('-----------------------------  System start  -----------------------------');
//show first text
bot.start(function (ctx) {
    logUserAction(ctx, 'start');
    sendWelcome(ctx);
});
//send help
bot.help(function (ctx) {
    logUserAction(ctx, 'help');
    sendHelp(ctx);
});
//show /hilfe (same as /help)
bot.command(helpCommand, function (ctx) {
    logUserAction(ctx, helpCommand);
    sendHelp(ctx);
});
//show tutorial
bot.command(tutorialCommand, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logUserAction(ctx, tutorialCommand);
                return [4 /*yield*/, sendGetPlanTutorial(ctx)];
            case 1:
                _a.sent();
                return [4 /*yield*/, sendSubscribePlanTutorial(ctx)];
            case 2:
                _a.sent();
                return [4 /*yield*/, sendSubscribeClassTutorial(ctx)];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
//check if new plans are online and send updated plan(s)
bot.command(updateCommand, function (ctx) {
    logUserAction(ctx, updateCommand);
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
//subscribe to plan updates
bot.command(subscribeCommand, function (ctx) {
    logUserAction(ctx, subscribeCommand);
    Bot.readFileToArray(userFilePath).then(function (arr) { return __awaiter(_this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    content = "" + ctx['update']['message']['from']['id'];
                    if (!!arr.includes(content)) return [3 /*break*/, 4];
                    fs.appendFileSync(userFilePath, content + '\n');
                    return [4 /*yield*/, ctx.reply('Du erhälst nun regelmmäßig die neusten Vertretungspläne.')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    ctx.reply('Du bist bereits im Verteiler. Wenn du keine Benachrichtigungen mehr willst, klick auf /' + unsubscribeCommand + '');
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); });
});
//unsubscribe from plan updates
bot.command(unsubscribeCommand, function (ctx) {
    logUserAction(ctx, unsubscribeCommand);
    Bot.removeLineFromTextFile(userFilePath, ctx['update']['message']['from']['id']);
    ctx.reply('Alles klar, ich sende dir keine Vertretungspläne mehr 🙁');
});
//subscribe to class
bot.command(subscribeClassCommand, function (ctx) {
    logUserAction(ctx, subscribeClassCommand);
    classSelectionFinalAction = 'subscribeClass';
    createAndSendClassLevelList(ctx['update']['message']['from']['id']);
});
bot.action(/level-(\d{1,2}|DAZ)/, function (ctx) {
    logUserAction(ctx, 'select class level ' + ctx['update']['callback_query']['data'].split('-')[1]);
    // console.logUserAction(`received class level: ${ctx['update']['callback_query']['data']}`);
    createAndSendClassList(ctx['update']['callback_query']['data'].split('-')[1], ctx['update']['callback_query']['from']['id']);
});
bot.action(/class-(\d{1,2}\w|DAZ-Klasse|DAZ-Aufbau)/, function (ctx) {
    var selectedClass = ctx['update']['callback_query']['data'].split('-')[1];
    logUserAction(ctx, 'select class ' + selectedClass);
    // console.logUserAction(`received class: ${selectedClass}`);
    //final action?
    switch (classSelectionFinalAction) {
        case 'subscribeClass':
            subscribeClass(selectedClass, ctx['update']['callback_query']['from']['id'], ctx);
            break;
        case 'unsubscribeClass':
            unsubscribeClass(selectedClass, ctx['update']['callback_query']['from']['id'], ctx);
            break;
        default:
            ctx.reply('Ups... Ich habe vergessen was ich eigentlich wollte. Versuche es bitte erneut.');
    }
});
function logUserAction(ctx, action) {
    var userData = ctx['update']['message'] ? ctx['update']['message']['from'] : ctx['update']['callback_query']['from'];
    fs.appendFileSync(logPath, new Date() + " " + action + " " + userData['id'] + " " + userData['first_name'] + " " + userData['username'] + '\n');
}
function log(action) {
    fs.appendFileSync(logPath, new Date() + " " + action + '\n');
}
function createAndSendClassLevelList(userId) {
    var classLevelKeys = Object.keys(classes);
    var inlineClassLevel = [[]];
    for (var i = 0, level = 0, index = 0; i < classLevelKeys.length; i++, index++) {
        if (index == 4) {
            level++;
            index = 0;
            inlineClassLevel.push([]);
        }
        inlineClassLevel[level].push({ text: classLevelKeys[i], callback_data: 'level-' + classLevelKeys[i] });
    }
    bot.telegram.sendMessage(userId, 'Für welche Klassenstufe?', { reply_markup: JSON.stringify({ inline_keyboard: inlineClassLevel }) });
}
function createAndSendClassList(selectedLevel, userId) {
    console.log('selectedLevel');
    console.log(selectedLevel);
    var classKeys = classes[selectedLevel];
    var inlineClasses = [[]];
    for (var i = 0, level = 0, index = 0; i < classKeys.length; i++, index++) {
        if (index == 4) {
            level++;
            index = 0;
            inlineClasses.push([]);
        }
        inlineClasses[level].push({
            text: selectedLevel + classKeys[i],
            callback_data: 'class-' + selectedLevel + classKeys[i]
        });
    }
    bot.telegram.sendMessage(userId, 'Für welche Klasse?', { reply_markup: JSON.stringify({ inline_keyboard: inlineClasses }) });
}
function subscribeClass(selectedClass, userId, ctx) {
    //reset final action
    classSelectionFinalAction = '';
    Bot.readFileToArray(subscriberPath).then(function (arr) {
        var content = userId + " " + selectedClass;
        if (!arr.includes(content)) {
            fs.appendFileSync(subscriberPath, content + '\n');
            ctx.reply('Perfekt! Ich sage dir bescheit, wenn es etwas für die ' + selectedClass + ' gibt.');
        }
        else {
            ctx.reply('Du bekommst schon updates für die ' + selectedClass);
        }
        setTimeout(function () {
            Bot.sendClassUpdateToSubscriber(3, selectedClass, userId);
        }, 500);
    });
}
function unsubscribeClass(selectedClass, userId, ctx) {
    //reset final action
    classSelectionFinalAction = '';
    Bot.removeLineFromTextFile(subscriberPath, userId + " " + selectedClass);
    ctx.reply('Alles klar, ich sende dir keine Vertretungspläne für die ' + selectedClass + ' mehr 🙁');
}
//unsubscribe from class
bot.command(unsubscribeClassCommand, function (ctx) {
    logUserAction(ctx, unsubscribeClassCommand);
    classSelectionFinalAction = 'unsubscribeClass';
    createAndSendClassLevelList(ctx['update']['message']['from']['id']);
});
//send plan 1 from storage
bot.command(plan1Command, function (ctx) {
    logUserAction(ctx, plan1Command);
    Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true);
});
//send plan 2 from storage
bot.command(plan2Command, function (ctx) {
    logUserAction(ctx, plan2Command);
    Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false);
});
//send class info when registered
bot.command(classCommand, function (ctx) {
    logUserAction(ctx, classCommand);
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
bot.on('text', function (ctx) {
    logUserAction(ctx, "unknown command: '" + ctx['update']['message']['text'] + "'");
});
function sendWelcome(ctx) {
    ctx.reply('Willkommen!\n' +
        '🤖 Ich stehe dir nun zu diensten, darf ich zeigen wie alles Funktioniert? Dann klick auf /' + tutorialCommand + '');
}
function sendHelp(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.reply('⚠️ Ich bin noch neu hier. Es kann also sein, dass ich mal einen Fehler mache, ich gebe aber mein bestes. 🤖')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.reply('❓ In Zukunft kannst du mir hier auch Fragen stellen, ich helfe dir dann weiter. Bis dahin muss die /' + tutorialCommand + ' ausreichen.')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendSubscribeClassTutorial(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.reply('--- Klasse abonieren ---\n' +
                        'Eigentlich brauchst du doch gar nicht den ganzen Vertretungsplan. Ich kann dir auch einfach bescheit sagen, wenn es etwas interessantes für dich gibt.')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.reply('Wenn du /' + subscribeClassCommand + ' eingibst speichere ich mir deine Klasse und sende dir deinen eigenen Vertretungsplan zu.')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.reply('⛔️ Mit dem Befehl /' + unsubscribeClassCommand + ' lösche ich deine Daten wieder.')];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendSubscribePlanTutorial(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.reply('--- Plan abonieren ---\n' +
                        'Wenn du immer alle neusten Vertretungspläne (PDF) erhaten möchtest, klicke auf /' + subscribeCommand + ' und ich sende dir den Plan automatisch zu, sobald es einen neuen gibt.')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.reply('⛔️ Sollte es dir irgendwann zu viel werden, dann klicke auf /' + unsubscribeCommand + ' und ich sende dir keine Pläne mehr zu.')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendGetPlanTutorial(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.reply('--- Einmalig laden ---\n' +
                        'Der Bot läd die Vertretungspläne von der Webseite der KGST (https://www.kgs-tornesch.de/vetretretungsplan.html). Es besteht kein Anspruch auf Vollständigkeit oder Korrektheit der Daten.')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.reply('Mit dem Befehlen /' + plan1Command + ' oder /' + plan2Command + ' sende ich dir den Vertretungsplan als PDF wie er auch auf der Webseite verfügbar ist.')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
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
                // console.logUserAction(obj);
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
    Bot.removeLineFromTextFile = function (filename, remove) {
        fs.readFile(filename, 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            var document = data.split('\n');
            var index = document.indexOf("" + remove);
            if (index != -1) {
                document.splice(index, 1);
                document = document.join('\n');
                fs.writeFile(filename, document, function () {
                });
            }
        });
    };
    Bot.startBot = function () {
        console.log('Cron gestartet');
        new cron_1.CronJob('0,15,30,45 7-8,16-18 * * *', function () {
            log('CronJob started');
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
