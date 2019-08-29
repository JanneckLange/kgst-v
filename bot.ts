import {CronJob} from 'cron';

const stream = require('stream');
const readline = require('readline');
const fs = require('fs');
const request = require('request');

const nodeBot = require('telegraf');
const bot = new nodeBot("667639490:AAFBuY8_6zuRsFAbeF5CPQCsLmUn5x_zDV8");

bot.start((ctx) => {
    console.log();
    Bot.readFileToArray().then(arr => {
        if (!arr.includes(''+ctx['update']['message']['from']['id'])) {
            fs.appendFileSync('user.txt', ctx['update']['message']['from']['id'] + '\n');
            ctx.reply('Hallo, du erhälst nun regemmäßig die neusten Vertretungspläne.');
        } else {
            ctx.reply('Willkommen zurück, du erhälst nun wieder regemmäßig die neusten Vertretungspläne.');
        }
    });
});

bot.help((ctx) => {
    ctx.reply('Der Bot hat dich gespeichert und sendet dir nun automatisch die aktuellsten Vertretungspläne zu.');
    ctx.reply('Der Bot läd die Vertretungspläne von der Webseite der KGST (https://www.kgs-tornesch.de/vetretretungsplan.html). Es besteht kein Anspruch auf Vollständigkeit oder Korrektheit der Daten.');
    ctx.reply('Mit "/1" wird der erste und mit "/2" der zweite Plan geladen. Dabei kann es vorkommen, dass die Pläne noch nicht mit denen der KGST aktuallisiert worden sind. Mit "/update" wird eine aktuallisierung erzwungen.');
    ctx.reply('Der Bot befindet sich in einer noch sehr frühen Phase der Entwicklung. Es kann daher noch zu fehlern kommen, ich bitte dies zu entschuldigen.');
});

//check if new plans are online and send updated plan(s)
bot.command('update', (ctx) => {

    Bot.updatePlan().then((update) => {
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
bot.command('1', (ctx) => {
    Bot.sendPlan(ctx['update']['message']['from']['id'], true);
});

//send plan 2 from storage
bot.command('2', (ctx) => {
    Bot.sendPlan(ctx['update']['message']['from']['id'], false);
});

bot.launch();

class Bot {

    static filesizeToday;
    static filezizeTomorow;

    public static startScripts() {
        Bot.startBot();
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
                    let filesize = Bot.getFilesizeInBytes(file);

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
    static getFilesizeInBytes(filename): number {
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
    static sendPlan(chatId: string, today: boolean) {
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
        let two = await Bot.loadPlan(false);
        return (one || two) ? ((one && two) ? 3 : (one ? 1 : 2)) : 0;
    }

    /**
     * lese die user.txt file in ein array
     */
    static readFileToArray(): Promise<Array<string>> {
        return new Promise((res, rej) => {
            let filename = './user.txt';
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
            }else{
                res([])
            }
        })

    }

    private static startBot() {
        console.log('Cron gestartet');
        new CronJob('0,15,30,45 7-8,16-18 * * *', () => {
            console.log('Starte CronJob');
            Bot.updatePlan().then(update => {
                Bot.readFileToArray().then(arr => {
                    arr.forEach((el => {
                        if (update == 3 || update == 2) {
                            Bot.sendPlan(el, false);
                        }
                        if (update == 3 || update == 1) {
                            Bot.sendPlan(el, true);
                        }
                    }))
                })

            })
        }, () => {
        }, true, 'Europe/Berlin');
    }
}

export {Bot};
