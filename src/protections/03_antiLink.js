const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

module.exports = class AntiLink {
    constructor(client) {
        this.name = 'antiLink';
        this.client = client;
        client.on('messageCreate', async (message) => this.handle(message));
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiLink?.enabled) return;

        logger.event(message.guild, 'antiLink', '🔗', message.author.id, message.author.tag, `${message.author.tag} sent a link in #${message.channel.name}`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const urls = message.content.match(URL_REGEX);
        if (!urls) return;

        const whitelisted = guild.settings.antiLink.whitelistedDomains || [];
        for (const url of urls) {
            try {
                const domain = new URL(url).hostname;
                if (!whitelisted.some(d => domain.includes(d))) {
                    const punishment = guild.settings.antiLink.punishment || 'timeout';
                    const duration = guild.settings.antiLink.duration || 300000;
                    await message.delete().catch(() => {});
                    await punisher.punish(message.guild, message.author.id, punishment, `Link detection: ${domain}`, duration);
                    logger.warn(message.guild, 'antiLink', `Link blocked from ${message.author.tag}: ${domain}`);
                    return;
                }
            } catch {
                continue;
            }
        }
    }
};
