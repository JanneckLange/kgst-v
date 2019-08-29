import {CronJob} from 'cron';

const moment = require('moment');
const fs = require('fs');
const request = require('request');

const nodeBot = require('telegraf');
const bot = new nodeBot("667639490:AAFBuY8_6zuRsFAbeF5CPQCsLmUn5x_zDV8");

bot.start((ctx) => {
    console.log(ctx['update']['message']['from']['id']);
    ctx.reply('Welcome');
});

bot.help((ctx) => ctx.reply('Hilfe noch nicht verfügbar'));

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


    private static startBot() {
        console.log('Cron gestartet');
        new CronJob('0,15,30,45 7-8,16-18 * * *', () => {
            Bot.updatePlan().then(update=>{
                //todo send to all users with activated updates

                // if (update == 3 || update == 2) {
                //     Bot.sendPlan(ctx['update']['message']['from']['id'], false);
                // }
                // if (update == 3 || update == 1) {
                //     Bot.sendPlan(ctx['update']['message']['from']['id'], true);
                // }
            })
        }, () => {
        }, true, 'Europe/Berlin');
    }
}

export {Bot};
