const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiMassMention {
    constructor(client) {
        this.name = 'antiMassMention';
        this.client = client;
        client.on('messageCreate', async (message) => this.handle(message));
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiMassMention?.enabled) return;

        logger.event(message.guild, 'antiMassMention', '📢', message.author.id, message.author.tag, `${message.author.tag} mass mentioned ${message.mentions.users.size + message.mentions.roles.size + message.mentions.channels.size} users/roles`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const mentionCount = (message.mentions.users.size + message.mentions.roles.size + message.mentions.channels.size);
        if (mentionCount > (guild.settings.antiMassMention.maxMentions || 5)) {
            const punishment = guild.settings.antiMassMention.punishment || 'timeout';
            const duration = guild.settings.antiMassMention.duration || 300000;
            await message.delete().catch(() => {});
            await punisher.punish(message.guild, message.author.id, punishment, `Mass mention: ${mentionCount} mentions`, duration);
            logger.warn(message.guild, 'antiMassMention', `Mass mention from ${message.author.tag}: ${mentionCount} mentions`);
        }
    }
};
