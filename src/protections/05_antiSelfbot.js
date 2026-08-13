const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiSelfbot {
    constructor(client) {
        this.name = 'antiSelfbot';
        this.client = client;
        this.suspicious = new Map();
        client.on('messageCreate', async (message) => this.handle(message));
    }

    async handle(message) {
        if (!message.author.bot && message.guild) {
            const db = require('../database/db');
            const guild = db.getGuild(message.guild.id);
            if (!guild.settings?.antiSelfbot?.enabled) return;

            logger.event(message.guild, 'antiSelfbot', '👤', message.author.id, message.author.tag, `${message.author.tag} detected as selfbot`, 'danger');

            if (await punisher.isExempt(message.guild, message.author.id)) return;

            const flags = [];
            if (message.content && message.content.includes('\n') && message.content.split('\n').length > 15) flags.push('mass_lines');
            if (message.author.bot) flags.push('is_bot');

            if (flags.length >= 1) {
                if (!this.suspicious.has(message.author.id)) this.suspicious.set(message.author.id, 0);
                this.suspicious.set(message.author.id, this.suspicious.get(message.author.id) + 1);

                if (this.suspicious.get(message.author.id) >= 3) {
                    const punishment = guild.settings.antiSelfbot.punishment || 'ban';
                    await message.delete().catch(() => {});
                    await punisher.punish(message.guild, message.author.id, punishment, 'Selfbot detected');
                    logger.warn(message.guild, 'antiSelfbot', `Selfbot detected: ${message.author.tag}`);
                }
            }
        }
    }
};
