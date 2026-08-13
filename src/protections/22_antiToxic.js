const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiToxic {
    constructor(client) {
        this.name = 'antiToxic';
        this.client = client;
        client.on('messageCreate', async (message) => this.handle(message));
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiToxic?.enabled) return;

        logger.event(message.guild, 'antiToxic', '☣️', message.author.id, message.author.tag, `${message.author.tag} sent inappropriate message in #${message.channel.name}`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const words = guild.settings.antiToxic.words || [];
        if (words.length === 0) return;

        const content = message.content.toLowerCase();
        for (const word of words) {
            if (content.includes(word.toLowerCase())) {
                const punishment = guild.settings.antiToxic.punishment || 'timeout';
                const duration = guild.settings.antiToxic.duration || 300000;
                await message.delete().catch(() => {});
                await punisher.punish(message.guild, message.author.id, punishment, `Toxic word: ${word}`, duration);
                logger.warn(message.guild, 'antiToxic', `Toxic word blocked from ${message.author.tag}: ${word}`);
                return;
            }
        }
    }
};
