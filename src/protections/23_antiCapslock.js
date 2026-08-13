const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiCapslock {
    constructor(client) {
        this.name = 'antiCapslock';
        this.client = client;
        client.on('messageCreate', async (message) => this.handle(message));
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiCapslock?.enabled) return;

        logger.event(message.guild, 'antiCapslock', '🔠', message.author.id, message.author.tag, `${message.author.tag} sent message with high caps in #${message.channel.name}`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const content = message.content.replace(/[^a-zA-Z]/g, '');
        if (content.length < (guild.settings.antiCapslock.minLength || 10)) return;

        const capsCount = content.split('').filter(c => c === c.toUpperCase() && c !== c.toLowerCase()).length;
        const capPercent = (capsCount / content.length) * 100;

        if (capPercent > (guild.settings.antiCapslock.capPercent || 70)) {
            const punishment = guild.settings.antiCapslock.punishment || 'timeout';
            const duration = guild.settings.antiCapslock.duration || 60000;
            await message.delete().catch(() => {});
            await punisher.punish(message.guild, message.author.id, punishment, `Capslock detected (${Math.round(capPercent)}%)`, duration);
            logger.warn(message.guild, 'antiCapslock', `Capslock from ${message.author.tag}: ${Math.round(capPercent)}%`);
        }
    }
};
