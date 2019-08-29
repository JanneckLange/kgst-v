import {CronJob} from 'cron';

const stream = require('stream');
const readline = require('readline');
const fs = require('fs');
const request = require('request');
const pdf = require('pdf-parse');

const nodeBot = require('telegraf');
const bot = new nodeBot("667639490:AAHDzeKbWi5kWM5vjZHqQ24ZBhc9q15WgTo");

let userFilePath = './user.txt';
let subscriberPath = './subscriber.txt';

bot.start((ctx) => {
    ctx.reply('Willkommen!\nSieht so aus als würdest du gerne den Vertretungsplan der KGST sehen. \n' +
        'Mit dem Befehlen /1 oder /2 bekommst du den ganzen Plan als PDF.\n' +
        'Wenn du immer automatisch den neuesten zugesendet bekommen willst /subscribe doch einfach.\n' +
        'Wenn du nur die Infos einer bestimmten Klasse haben willst, dann sende die Klasse mit (z.B.: /subscribe 5f)');
});

bot.help((ctx) => {
    ctx.reply('Der Bot läd die Vertretungspläne von der Webseite der KGST (https://www.kgs-tornesch.de/vetretretungsplan.html). Es besteht kein Anspruch auf Vollständigkeit oder Korrektheit der Daten.');
    ctx.reply('Mit "/1" wird der erste und mit "/2" der zweite Plan geladen. Dabei kann es vorkommen, dass die Pläne noch nicht mit denen der KGST aktuallisiert worden sind. Mit "/update" wird eine aktuallisierung erzwungen.');
    ctx.reply('Der Bot befindet sich in einer noch sehr frühen Phase der Entwicklung. Es kann daher noch zu fehlern kommen, ich bitte dies zu entschuldigen.');
});

//check if new plans are online and send updated plan(s)
bot.command('update', (ctx) => {
    Bot.updatePlan().then((update) => {
        ctx.reply(update ? 'Vertretungspläne geupdatet' : 'Vertretungspläne bereits aktuell');
        if (update == 3 || update == 2) {
            Bot.sendPdfPlan(ctx['update']['message']['from']['id'], false);
        }
        if (update == 3 || update == 1) {
            Bot.sendPdfPlan(ctx['update']['message']['from']['id'], true);
        }
    });
});

bot.command('subscribe', ctx => {
    //subscribe to class
    if (ctx['update']['message']['text'].split(' ')[1]) {
        Bot.readFileToArray(subscriberPath).then(arr => {
            let content = `${ctx['update']['message']['from']['id']} ${ctx['update']['message']['text'].split(' ')[1]}`;
            if (!arr.includes(content)) {
                fs.appendFileSync(subscriberPath, content + '\n');
                ctx.reply('Sie erhalten nun updates für die Klasse ' + ctx['update']['message']['text'].split(' ')[1]);
            } else {
                ctx.reply('Sie sind beriets registriert');
            }
            setTimeout(() => {
                Bot.sendToUserClassUpdate(3, ctx['update']['message']['text'].split(' ')[1], ctx['update']['message']['from']['id'])
            }, 1000)
        });
    }
    //subscribe
    else {
        Bot.readFileToArray(userFilePath).then(arr => {
            let content = `${ctx['update']['message']['from']['id']}`;
            if (!arr.includes(content)) {
                fs.appendFileSync(userFilePath, content + '\n');
                ctx.reply('Du erhälst nun regemmäßig die neusten Vertretungspläne.');
            } else {
                ctx.reply('Sie sind bereits im Verteiler. Wenn sie keine Benachrichtigungen mehr wollen, dann senden sie /unsubscribe');
            }
        });
        setTimeout(() => {
            ctx.reply('Wenn du nur Benachrichtigungen für eine Klasse haben willst, dann senden bitte eine Klasse mit. (Bsp.: "/subscribe 8b")');
            setTimeout(() => {
                Bot.sendPdfPlan(ctx['update']['message']['from']['id'], true);
                Bot.sendPdfPlan(ctx['update']['message']['from']['id'], false);
            }, 500)
        }, 500);
    }
});

bot.command('unsubscribe', ctx => {
    // ctx['update']['message']['text'].split(' ')[1]
    ctx.reply('noch nicht verfügbar');
});

//send plan 1 from storage
bot.command('1', (ctx) => {
    Bot.sendPdfPlan(ctx['update']['message']['from']['id'], true);
});

//send plan 2 from storage
bot.command('2', (ctx) => {
    Bot.sendPdfPlan(ctx['update']['message']['from']['id'], false);
});

bot.command('class',(ctx)=>{
    Bot.readFileToArray(subscriberPath).then(arr => {
        arr.forEach(data => {
            if(`${data.split(' ')[0]}` === `${ctx['update']['message']['from']['id']}`){
                Bot.sendToUserClassUpdate(3, data.split(' ')[1], ctx['update']['message']['from']['id'])
            }
        });
    });
});

bot.launch();


class Bot {

    static filesizeToday;
    static filezizeTomorow;

    public static startScripts() {
        Bot.startBot();
    }

    static parsePDFToJson(today: boolean) {
        const classReg = /([56789]|[1][0123])[a-z]+/g;
        const hourReg = /\d{1,2}( - \d{1,2})*/;
        const kgsReg = /KGS_[0-9]*[a-z]_FuF[0-9]?/;
        const lessons = ['WiPo', 'KR', 'ELZ', 'LRS', 'TGT', 'M-E2', 'DB-ProTab', 'ProTab', 'Hosp0', 'WiPo', 'WPK2-ITM', 'WPK1-TEC1', 'WPK1-TEC3', 'WPK1-WL', 'WPK1-WL', 'Ch-1', 'Ch', 'DAZ-Aufbau', 'DAZ', 'Ku-2', 'Ku', 'Bio', 'Phy', 'Rel', 'Phi', 'NaWi', 'Mu', 'DB-WK', 'Wk', 'DB-M', 'Sp', 'DB-E', 'D', 'M', 'E']; // todo DB-XXX / KGS_5a_FuF
        const roomReg = /[A-Z]\d{3,}(\/\d{3,})?|---|H \(alt\) 3/;
        const removeReg = /\s\(\w{2,3}\)/g;

        return new Promise((res, rej) => {
            const pdf_path = __dirname + '\\' + (today ? 1 : 2) + '.pdf';
            let dataBuffer = fs.readFileSync(pdf_path);
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
                            // console.log(classes)
                            // console.log(m)
                            // console.log(el)
                            // console.log('________________________')
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

                let obj = {
                    pages: data.numpages,
                    creationDate: data.info['CreationDate'].slice(2, 14),
                    classes: allClasses,
                    text: text
                };
                // console.log(obj);
                fs.writeFileSync((today ? 1 : 2) + '.json', JSON.stringify(obj), 'binary');
                res(obj);
            });
        })
    }

    /**
     * Lade Vertretungsplan und speichere ihn im Grundpfad
     * @param {boolean} today
     */
    static loadPlan(today: boolean): Promise<boolean> {
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
                    let file = (today ? 1 : 2) + '.pdf';
                    fs.writeFileSync(file, body, 'binary');
                    let filesize = Bot.getFileSizeInBytes(file);

                    if (fs.existsSync(file) && ((today && Bot.filesizeToday == filesize) || (!today && Bot.filezizeTomorow == filesize))) {
                        console.log('Datei wurde nicht aktuallisiert (bereits vorhanden)');
                        res(false);
                    } else {
                        console.log('update file ' + file + ' (' + filesize + ')');
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
     * sende Datei an nutzer
     * @param {number} chatId
     * @param today
     */
    static sendPdfPlan(chatId: string, today: boolean) {
        try {
            if (fs.existsSync(__dirname + '/' + (today ? 1 : 2) + '.pdf')) {
                bot.telegram.sendDocument(chatId, {
                    source: fs.createReadStream(__dirname + '/' + (today ? 1 : 2) + '.pdf'),
                    filename: (today ? 1 : 2) + '.pdf'
                });
            }
        } catch (e) {
        }
    }

    /**
     * 3: beide
     * 2: nur 2
     * 1: nur 1
     * 0: keiner
     */
    static async updatePlan(): Promise<number> {
        let one = await Bot.loadPlan(true);
        if (one) {
            Bot.parsePDFToJson(true);
        }
        let two = await Bot.loadPlan(false);
        if (two) {
            Bot.parsePDFToJson(false);
        }
        return (one || two) ? ((one && two) ? 3 : (one ? 1 : 2)) : 0;
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

    static sendUpdates(update: number) {
        Bot.updateGlobal(update);
        Bot.updateClass(update);
    }

    /**
     * send updated plans to user
     * @param update
     */
    static updateGlobal(update: number) {
        Bot.readFileToArray(userFilePath).then(arr => {
            arr.forEach((chatId => {
                if (update == 3 || update == 2) {
                    Bot.sendPdfPlan(chatId, false);
                }
                if (update == 3 || update == 1) {
                    Bot.sendPdfPlan(chatId, true);
                }
            }))
        })
    }

    /**
     * send updated classes to subscriber
     * @param update
     */
    static updateClass(update: number) {
        Bot.readFileToArray(subscriberPath).then(arr => {
            arr.forEach(user => {
                Bot.sendToUserClassUpdate(update, user.split(' ')[1], user.split(' ')[0]);
            });
        });
    }

    /**
     * send class update to user
     * @param {number} update
     * @param {string} subscribedClass
     * @param {string} userId
     */
    static sendToUserClassUpdate(update: number, subscribedClass: string, userId: string) {
        let data = [];
        if (update == 3 || update == 2) {
            data = data.concat(Bot.formatClassData(false, subscribedClass));
        }
        if (update == 3 || update == 1) {
            data = data.concat(Bot.formatClassData(true, subscribedClass));
        }
        if (data) {
            data.forEach(x => {
                if (x)
                    bot.telegram.sendMessage(userId, x);
            });
        }
    }

    static formatClassData(today: boolean, subscribedClass: string) {
        let rawdata = fs.readFileSync(__dirname + '/' + (today ? 1 : 2) + '.json');
        let plan = JSON.parse(rawdata);
        if (plan.classes.includes(subscribedClass)) {
            let data = [];
            plan.text.forEach(x => {
                if (x.class.includes(subscribedClass)) {
                    data.push(`${today ? 'Heute' : 'Morgen'} ${subscribedClass}: Stunde:${x.hour} Fach:${x.lesson} Raum:${x.room} Art:${x.type} Text:${x.more}`)
                }
            });
            return data;
        } else {
            return null;
        }
    }

    private static startBot() {
        console.log('Cron gestartet');
        new CronJob('0,15,30,45 7-8,16-18 * * *', () => {
            console.log('Starte CronJob');
            Bot.updatePlan().then(update => {
                Bot.sendUpdates(update);
            })
        }, () => {
        }, true, 'Europe/Berlin');
    }
}

export {Bot};
