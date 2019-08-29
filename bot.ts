import {CronJob} from 'cron';

const stream = require('stream');
const readline = require('readline');
const fs = require('fs');
const request = require('request');
const pdf = require('pdf-parse');

const nodeBot = require('telegraf');
const bot = new nodeBot("667639490:AAFviTUYsBW3RM3zHBjfWXgWQ1YjsIkswqc");

const userFilePath = './user.txt';
const subscriberPath = './subscriber.txt';
const pdfOnePath = './1.pdf';
const pdfTwoPath = './2.pdf';
const jsonOnePath = './1.json';
const jsonTwoPath = './2.json';
const logPath = './log.txt';

const plan1Command = 'plan1'; // Aktueller Plan
const plan2Command = 'plan2'; // Nächster Plan
const subscribeClassCommand = 'joinclass'; // Klassenupdates erhalten
const unsubscribeClassCommand = 'leaveclass'; //keine Klassenupdates mehr
const subscribeCommand = 'join'; // Updates erhlten
const unsubscribeCommand = 'leave'; // keine pdates erhlten
const classCommand = 'klasse';
const tutorialCommand = 'anleitung'; // Wie funktioniert das?
const helpCommand = 'hilfe';
const updateCommand = 'update';

let classSelectionFinalAction = '';

const classes = {
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
bot.start((ctx) => {
    logUserAction(ctx, 'start')

    sendWelcome(ctx);
});

//send help
bot.help((ctx) => {
    logUserAction(ctx, 'help')

    sendHelp(ctx);
});

//show /hilfe (same as /help)
bot.command(helpCommand, ctx => {
    logUserAction(ctx, helpCommand)

    sendHelp(ctx);
});

//show tutorial
bot.command(tutorialCommand, async ctx => {
    logUserAction(ctx, tutorialCommand)

    await sendGetPlanTutorial(ctx);
    await sendSubscribePlanTutorial(ctx);
    await sendSubscribeClassTutorial(ctx);
});

//check if new plans are online and send updated plan(s)
bot.command(updateCommand, (ctx) => {
    logUserAction(ctx, updateCommand)

    Bot.triggerPlanUpdate().then((update) => {
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
bot.command(subscribeCommand, ctx => {
    logUserAction(ctx, subscribeCommand)

    Bot.readFileToArray(userFilePath).then(async arr => {
        let content = `${ctx['update']['message']['from']['id']}`;
        if (!arr.includes(content)) {
            fs.appendFileSync(userFilePath, content + '\n');
            await ctx.reply('Du erhälst nun regelmmäßig die neusten Vertretungspläne.');
            await Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true);
            await Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false);
        } else {
            ctx.reply('Du bist bereits im Verteiler. Wenn du keine Benachrichtigungen mehr willst, klick auf /' + unsubscribeCommand + '');
        }
    });
});

//unsubscribe from plan updates
bot.command(unsubscribeCommand, ctx => {
    logUserAction(ctx, unsubscribeCommand)

    Bot.removeLineFromTextFile(userFilePath, ctx['update']['message']['from']['id']);
    ctx.reply('Alles klar, ich sende dir keine Vertretungspläne mehr 🙁')
});

//subscribe to class
bot.command(subscribeClassCommand, ctx => {
    logUserAction(ctx, subscribeClassCommand)

    classSelectionFinalAction = 'subscribeClass';
    createAndSendClassLevelList(ctx['update']['message']['from']['id'])
});

bot.action(/level-(\d{1,2}|DAZ)/, (ctx) => {
    logUserAction(ctx, 'select class level ' + ctx['update']['callback_query']['data'].split('-')[1]);
    // console.logUserAction(`received class level: ${ctx['update']['callback_query']['data']}`);
    createAndSendClassList(ctx['update']['callback_query']['data'].split('-')[1], ctx['update']['callback_query']['from']['id']);
});
bot.action(/class-(\d{1,2}\w|DAZ-Klasse|DAZ-Aufbau)/, (ctx) => {
    let selectedClass = ctx['update']['callback_query']['data'].split('-')[1];
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
    let userData = ctx['update']['message'] ? ctx['update']['message']['from'] : ctx['update']['callback_query']['from'];
    fs.appendFileSync(logPath, `${new Date()} ${action} ${userData['id']} ${userData['first_name']} ${userData['username']}` + '\n');
}

function log(action) {
    fs.appendFileSync(logPath, `${new Date()} ${action}` + '\n');
}

function createAndSendClassLevelList(userId) {
    let classLevelKeys = Object.keys(classes);
    let inlineClassLevel = [[]];
    for (let i = 0, level = 0, index = 0; i < classLevelKeys.length; i++, index++) {
        if (index == 4) {
            level++;
            index = 0;
            inlineClassLevel.push([]);
        }
        inlineClassLevel[level].push({text: classLevelKeys[i], callback_data: 'level-' + classLevelKeys[i]});
    }
    bot.telegram.sendMessage(userId, 'Für welche Klassenstufe?',
        {reply_markup: JSON.stringify({inline_keyboard: inlineClassLevel})});
}

function createAndSendClassList(selectedLevel: string, userId) {
    console.log('selectedLevel')
    console.log(selectedLevel)
    let classKeys = classes[selectedLevel];
    let inlineClasses = [[]];
    for (let i = 0, level = 0, index = 0; i < classKeys.length; i++, index++) {
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
    bot.telegram.sendMessage(userId, 'Für welche Klasse?',
        {reply_markup: JSON.stringify({inline_keyboard: inlineClasses})});

}

function subscribeClass(selectedClass, userId, ctx) {
    //reset final action
    classSelectionFinalAction = '';
    Bot.readFileToArray(subscriberPath).then(arr => {
        let content = `${userId} ${selectedClass}`;
        if (!arr.includes(content)) {
            fs.appendFileSync(subscriberPath, content + '\n');
            ctx.reply('Perfekt! Ich sage dir bescheit, wenn es etwas für die ' + selectedClass + ' gibt.')
        } else {
            ctx.reply('Du bekommst schon updates für die ' + selectedClass);
        }
        setTimeout(() => {
            Bot.sendClassUpdateToSubscriber(3, selectedClass, userId)
        }, 500)
    });
}

function unsubscribeClass(selectedClass, userId, ctx) {
    //reset final action
    classSelectionFinalAction = '';
    Bot.removeLineFromTextFile(subscriberPath, `${userId} ${selectedClass}`);
    ctx.reply('Alles klar, ich sende dir keine Vertretungspläne für die ' + selectedClass + ' mehr 🙁')
}

//unsubscribe from class
bot.command(unsubscribeClassCommand, ctx => {
    logUserAction(ctx, unsubscribeClassCommand)

    classSelectionFinalAction = 'unsubscribeClass';
    createAndSendClassLevelList(ctx['update']['message']['from']['id'])
});

//send plan 1 from storage
bot.command(plan1Command, (ctx) => {
    logUserAction(ctx, plan1Command)

    Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], true);
});

//send plan 2 from storage
bot.command(plan2Command, (ctx) => {
    logUserAction(ctx, plan2Command)
    Bot.sendPdfPlanToUser(ctx['update']['message']['from']['id'], false);
});

//send class info when registered
bot.command(classCommand, (ctx) => {
    logUserAction(ctx, classCommand)
    if (fs.existsSync(subscriberPath)) {
        let count = 0;
        Bot.readFileToArray(subscriberPath).then(arr => {
            arr.forEach(data => {
                if (`${data.split(' ')[0]}` === `${ctx['update']['message']['from']['id']}`) {
                    console.log(`Sende Vertretungen für ${data.split(' ')[1]} an ${ctx['update']['message']['from']['id']}`);
                    Bot.sendClassUpdateToSubscriber(3, data.split(' ')[1], ctx['update']['message']['from']['id']);
                    count++;
                }
            });
            if (!count) {
                sendReply();
            }
        });
    } else {
        sendReply();
    }

    function sendReply() {
        ctx.reply('Du hast keine Klasse Aboniert.');
        sendSubscribeClassTutorial(ctx);
    }
});

bot.on('text', ctx => {
    logUserAction(ctx, `unknown command: '${ctx['update']['message']['text']}'`);
});

function sendWelcome(ctx) {
    ctx.reply('Willkommen!\n' +
        '🤖 Ich stehe dir nun zu diensten, darf ich zeigen wie alles Funktioniert? Dann klick auf /' + tutorialCommand + '');
}

async function sendHelp(ctx) {
    await ctx.reply('⚠️ Ich bin noch neu hier. Es kann also sein, dass ich mal einen Fehler mache, ich gebe aber mein bestes. 🤖');
    await ctx.reply('❓ In Zukunft kannst du mir hier auch Fragen stellen, ich helfe dir dann weiter. Bis dahin muss die /' + tutorialCommand + ' ausreichen.');
}

async function sendSubscribeClassTutorial(ctx) {
    await ctx.reply('--- Klasse abonieren ---\n' +
        'Eigentlich brauchst du doch gar nicht den ganzen Vertretungsplan. Ich kann dir auch einfach bescheit sagen, wenn es etwas interessantes für dich gibt.');
    await ctx.reply('Wenn du /' + subscribeClassCommand + ' eingibst speichere ich mir deine Klasse und sende dir deinen eigenen Vertretungsplan zu.');
    await ctx.reply('⛔️ Mit dem Befehl /' + unsubscribeClassCommand + ' lösche ich deine Daten wieder.');
}

async function sendSubscribePlanTutorial(ctx) {
    await ctx.reply('--- Plan abonieren ---\n' +
        'Wenn du immer alle neusten Vertretungspläne (PDF) erhaten möchtest, klicke auf /' + subscribeCommand + ' und ich sende dir den Plan automatisch zu, sobald es einen neuen gibt.');
    await ctx.reply('⛔️ Sollte es dir irgendwann zu viel werden, dann klicke auf /' + unsubscribeCommand + ' und ich sende dir keine Pläne mehr zu.');
}

async function sendGetPlanTutorial(ctx) {
    await ctx.reply('--- Einmalig laden ---\n' +
        'Der Bot läd die Vertretungspläne von der Webseite der KGST (https://www.kgs-tornesch.de/vetretretungsplan.html). Es besteht kein Anspruch auf Vollständigkeit oder Korrektheit der Daten.');
    await ctx.reply('Mit dem Befehlen /' + plan1Command + ' oder /' + plan2Command + ' sende ich dir den Vertretungsplan als PDF wie er auch auf der Webseite verfügbar ist.');
}

bot.launch();


class Bot {

    static filesizeToday;
    static filezizeTomorow;

    public static startScripts() {
        Bot.startBot();
    }

    /**
     * 3: beide
     * 2: nur 2
     * 1: nur 1
     * 0: keiner
     */
    static async triggerPlanUpdate(): Promise<number> {
        let one = await Bot.loadAndSavePdqPlanWhenNecessary(true);
        if (one) {
            Bot.parsePdfPlanToJsonPlanAndSave(true);
        }
        let two = await Bot.loadAndSavePdqPlanWhenNecessary(false);
        if (two) {
            Bot.parsePdfPlanToJsonPlanAndSave(false);
        }
        return (one || two) ? ((one && two) ? 3 : (one ? 1 : 2)) : 0;
    }

    /**
     * Lade Vertretungsplan und speichere ihn im Grundpfad
     * @param {boolean} today
     */
    static loadAndSavePdqPlanWhenNecessary(today: boolean): Promise<boolean> {
        return new Promise((res, rej) => {
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
                    let file = (today ? pdfOnePath : pdfTwoPath);
                    fs.writeFileSync(file, body, 'binary');
                    let filesize = Bot.getFileSizeInBytes(file);

                    if (fs.existsSync(file) && ((today && Bot.filesizeToday == filesize) || (!today && Bot.filezizeTomorow == filesize))) {
                        console.log('Datei wurde nicht aktuallisiert (bereits vorhanden)');
                        res(false);
                    } else {
                        //todo decide my creation date
                        console.log('update file ' + file + ' (' + filesize + 'bytes)');
                        today ? Bot.filesizeToday = filesize : Bot.filezizeTomorow = filesize;
                        res(true);
                    }
                } else {
                    console.log(error);
                    rej();
                }
            });
        });


    }

    /**
     * Wandle Pdj in Text um und erstelle Vertretungsplan als Json
     * @param {boolean} today
     * */
    static parsePdfPlanToJsonPlanAndSave(today: boolean) {
        const classReg = /([56789]|[1][0123])[a-z]+/g;
        const hourReg = /\d{1,2}( - \d{1,2})*/;
        const kgsReg = /KGS_[0-9]*[a-z]_FuF[0-9]?/;
        const lessons = ['WiPo', 'KR', 'ELZ', 'LRS', 'TGT', 'M-E2', 'DB-ProTab', 'ProTab', 'Hosp0', 'WiPo', 'WPK2-ITM', 'WPK1-TEC1', 'WPK1-TEC3', 'WPK1-WL', 'WPK1-WL', 'Ch-1', 'Ch', 'DAZ-Aufbau', 'DAZ', 'Ku-2', 'Ku', 'Bio', 'Phy', 'Rel', 'Phi', 'NaWi', 'Mu', 'DB-WK', 'Wk', 'DB-M', 'Sp', 'DB-E', 'D', 'M', 'E']; // todo DB-XXX / KGS_5a_FuF
        const roomReg = /[A-Z]\d{3,}(\/\d{3,})?|---|H \(alt\) 3/;
        const removeReg = /\s\(\w{2,3}\)/g;
        const dateReg = /(?<=Online-Ausgabe\s\s)\d{1,2}.\d{1,2}.\s\/\s\w+/;

        return new Promise((res, rej) => {
            let dataBuffer = fs.readFileSync((today ? pdfOnePath : pdfTwoPath));
            pdf(dataBuffer).then(function (data) {
                let allText = data.text.split('\n');
                let text = [];
                let allClasses = [];

                //find all lines with classes and push classes to array
                allText.forEach(el => {
                    el = el.replace(removeReg, '');
                    //match = file row contains a class
                    let match = el.match(classReg);
                    if (match) {
                        //make multi classes to single classes => 5ab -> 5a,5b
                        match.forEach(m => {
                            //if class number has multiple class letters
                            let classes = [m];
                            if (m.match(/([56789]|[1][0123])[a-z]{2,}/)) {
                                let classNumber = m.match(/([56789]|[1][0123])/)[0];
                                let classLetters = m.match(/[a-z]/g);
                                classes = classLetters.map(x => classNumber + x);
                            }
                            allClasses.push(classes);
                            let hour = el.slice(m.length, el.length).match(hourReg)[0];

                            let lesson = el.match(kgsReg);
                            lesson = lesson ? lesson[0] : lessons.find(x => {
                                return el.slice(0, el.match(roomReg) ? el.match(roomReg).index : el.length).includes(x)
                            });

                            let type = el.slice(m.length + hour.length + lesson.length, el.match(roomReg) ? el.match(roomReg).index : el.length);
                            let room = el.match(roomReg) ? el.match(roomReg)[0] : '';


                            text.push({
                                class: classes,
                                //5abcdef6KGS_5a_FuFEntfall--- matcht doppelt? 5abcdef und 5a
                                //'6abdeg5KGS_6a_FuF2Entfall--- genauso
                                hour: hour,//confirmed
                                lesson: lesson,//kann noch zu fehlern führen, dann in array eintragen
                                room: room,// kann noch zu fehlern führen, bei sport oder doppelräumen
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
                console.log(data.text.match(dateReg)[0])
                let obj = {
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
        })
    }

    static triggerSendAllUpdates(update: number) {
        Bot.sendPdfFileUpdateToAllUser(update);
        Bot.sendClassUpdateToAllSubscriber(update);
    }

    /**
     * send updated plans to user
     * @param update
     */
    static sendPdfFileUpdateToAllUser(update: number) {
        if (fs.existsSync(userFilePath)) {
            Bot.readFileToArray(userFilePath).then(arr => {
                arr.forEach((chatId => {
                    if (update == 3 || update == 2) {
                        Bot.sendPdfPlanToUser(chatId, false);
                    }
                    if (update == 3 || update == 1) {
                        Bot.sendPdfPlanToUser(chatId, true);
                    }
                }))
            })
        } else {
            console.error(userFilePath + ' did not exist.')
        }

    }

    /**
     * sende Datei an nutzer
     * @param {number} chatId
     * @param today
     */
    static async sendPdfPlanToUser(chatId: string, today: boolean) {
        const filename = today ? pdfOnePath : pdfTwoPath;

        if (!fs.existsSync(filename)) {
            await Bot.triggerPlanUpdate();
        }
        await bot.telegram.sendDocument(chatId, {
            source: fs.createReadStream(filename),
            filename: (today ? 1 : 2) + '.pdf'
        });
    }

    /**
     * send updated classes to subscriber
     * @param update
     */
    static sendClassUpdateToAllSubscriber(update: number) {
        if (fs.existsSync(subscriberPath)) {
            Bot.readFileToArray(subscriberPath).then(arr => {
                arr.forEach(user => {
                    Bot.sendClassUpdateToSubscriber(update, user.split(' ')[1], user.split(' ')[0]);
                });
            });
        } else {
            console.error(subscriberPath + ' did not exist');
        }

    }

    /**
     * send class update to user
     * @param {number} update
     * @param {string} subscribedClass
     * @param {string} userId
     */
    static sendClassUpdateToSubscriber(update: number, subscribedClass: string, userId: string) {
        let data = [];
        if (update == 3 || update == 2) {
            data = data.concat(Bot.formatClassData(false, subscribedClass));
        }
        if (update == 3 || update == 1) {
            data = data.concat(Bot.formatClassData(true, subscribedClass));
        }
        data.forEach(x => {
            if (x) {
                bot.telegram.sendMessage(userId, x);
            }
        });

    }


    /**
     * get filesize in bytes
     * @param filename
     */
    static getFileSizeInBytes(filename): number {
        if (!fs.existsSync(filename)) {
            return 0;
        }
        const stats = fs.statSync(filename);
        return stats.size;
    }

    /**
     * lese die user.txt file in ein array
     */
    static readFileToArray(filename: string): Promise<Array<string>> {
        return new Promise((res, rej) => {
            if (fs.existsSync(filename)) {
                const instream = fs.createReadStream(filename);
                const outstream = new stream;
                const rl = readline.createInterface(instream, outstream);
                const arr = [];
                rl.on('line', function (line) {
                    // process line here
                    arr.push(line);
                });

                rl.on('close', function () {
                    // do something on finish here
                    res(arr);
                });
            } else {
                res([])
            }
        })

    }

    static formatClassData(today: boolean, subscribedClass: string) {
        const filePath = today ? jsonOnePath : jsonTwoPath;
        if (!fs.existsSync(filePath)) {
            console.log(filePath + ' did not exist. Create file...');
            Bot.triggerPlanUpdate();
        }
        let plan = JSON.parse(fs.readFileSync(filePath));
        if (plan.classes.includes(subscribedClass)) {
            let data = [];
            plan.text.forEach(x => {
                if (x.class.includes(subscribedClass)) {
                    data.push(`${plan.date} (${subscribedClass})\n${x.hour}. Stunde ${x.lesson} - ${x.type}\n${x.room === '---' ? '' : 'Raum: ' + x.room} ${x.more ? 'Info: ' + x.more : ''}`)
                }
            });
            return data;
        } else {
            return null;
        }
    }

    static removeLineFromTextFile(filename, remove) {
        fs.readFile(filename, 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            let document = data.split('\n');
            const index = document.indexOf(`${remove}`);
            if (index != -1) {
                document.splice(index, 1);
                document = document.join('\n');
                fs.writeFile(filename, document, () => {
                });
            }
        });
    }

    private static startBot() {
        console.log('Cron gestartet');
        new CronJob('0,15,30,45 7-8,16-18 * * *', () => {
            log('CronJob started')
            console.log('Starte CronJob');
            Bot.triggerPlanUpdate().then(update => {
                Bot.triggerSendAllUpdates(update);
            })
        }, () => {
        }, true, 'Europe/Berlin');
    }
}

export {Bot};
