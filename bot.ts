import {CronJob} from 'cron';

const moment = require('moment');
const fs = require('fs');
const request = require('request');

const nodeBot = require('telegraf');
const bot = new nodeBot("667639490:AAFBuY8_6zuRsFAbeF5CPQCsLmUn5x_zDV8");

bot.start((ctx) => {
    console.log(ctx['update']['message']['from']);
    ctx.reply('Welcome');
});
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.command('update', (ctx) => {
    if (moment() < moment().hours(8).minutes(0)) {
        //lade von gestern nachmittag
        console.log('reload yesterday')
        Bot.updatePlanYesterday()
    } else if (moment() < moment().hours(8).minutes(0)) {
        //lade von heute morgen
        console.log('reload today morning')
        Bot.updatePlanMorning()
    } else {
        //lade von heute abend
        console.log('reload today afternoon')
        Bot.updatePlanAfternoon()
    }

    ctx.reply('Verträtungspläne geupdatet')
});
bot.command('heute', (ctx) => {
    Bot.sendPlan(ctx['update']['message']['from']['id'], moment().format('YYYYMMDD'));
});
bot.command('morgen', (ctx) => {
    Bot.sendPlan(ctx['update']['message']['from']['id'], moment().add(1, 'd').format('YYYYMMDD'));
});
bot.command('ubermorgen', (ctx) => {
    Bot.sendPlan(ctx['update']['message']['from']['id'], moment().add(2, 'd').format('YYYYMMDD'));
});
bot.launch();

class Bot {
    public static startScripts() {
        Bot.startBot();
    }

    /**
     * Lade Vertretungsplan und speichere ihn im Grundpfad
     * @param {boolean} today
     * @param {string} filename
     */
    static loadPlan(today: boolean, filename: string = null) {
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
                } else {
                    console.log(error)
                    console.log(response.statusCode)
                }
            });
        } catch (e) {

        }
    }

    /**
     * sende Datei an nutzer
     * @param {number} chatId
     * @param {string} filename
     */
    static sendPlan(chatId: string, filename: string) {
        try {
            if (fs.existsSync(__dirname + '/' + filename + '.pdf')) {
                bot.telegram.sendDocument(chatId, {
                    source: fs.createReadStream(__dirname + '/' + filename + '.pdf'),
                    filename: filename + '.pdf'
                });
            }
        } catch (e) {
        }
    }

    static updatePlanYesterday() {
        Bot.loadPlan(true, moment().format('YYYYMMDD'));
        Bot.loadPlan(false, moment().add(1, 'd').format('YYYYMMDD'))
    }

    static updatePlanMorning() {
        Bot.loadPlan(true, moment().format('YYYYMMDD'));
        Bot.loadPlan(false, moment().add(1, 'd').format('YYYYMMDD'))
    }

    static updatePlanAfternoon() {
        Bot.loadPlan(true, moment().add(1, 'd').format('YYYYMMDD'));
        Bot.loadPlan(false, moment().add(2, 'd').format('YYYYMMDD'))
    }

    private static startBot() {
        console.log('Cron gestartet');
        new CronJob('15 8 * * *', () => {
            Bot.updatePlanMorning();
        }, () => {
            console.log('job is done')
        }, true, 'Europe/Berlin');

        new CronJob('15 17 * * *', () => {
            Bot.updatePlanAfternoon();
        }, () => {
            console.log('job is done')
        }, true, 'Europe/Berlin');
    }
}

export {Bot};
