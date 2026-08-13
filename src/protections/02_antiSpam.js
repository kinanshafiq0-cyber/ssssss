const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

const CLEANUP_INTERVAL = 60000;

module.exports = class AntiSpam {
    constructor(client) {
        this.name = 'antiSpam';
        this.client = client;
        this.messageCache = new Map();
        client.on('messageCreate', async (message) => this.handle(message));
        setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, msgs] of this.messageCache) {
            const recent = msgs.filter(m => now - m.time < 10000);
            if (recent.length === 0) this.messageCache.delete(key);
            else this.messageCache.set(key, recent);
        }
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiSpam?.enabled) return;

        logger.event(message.guild, 'antiSpam', '📨', message.author.id, message.author.tag, `${message.author.tag} spamming in #${message.channel.name}`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const now = Date.now();
        const key = `${message.author.id}-${message.guild.id}`;
        const timeWindow = guild.settings.antiSpam.timeWindow || 3000;
        const maxMessages = guild.settings.antiSpam.maxMessages || 5;

        if (!this.messageCache.has(key)) {
            this.messageCache.set(key, []);
        }

        const msgs = this.messageCache.get(key);
        msgs.push({ content: message.content, time: now });
        const recentMsgs = msgs.filter(m => now - m.time < timeWindow);
        this.messageCache.set(key, recentMsgs);

        if (recentMsgs.length > maxMessages) {
            const punishment = guild.settings.antiSpam.punishment || 'timeout';
            const duration = guild.settings.antiSpam.duration || 300000;
            await punisher.punish(message.guild, message.author.id, punishment, 'Spam detection: Too many messages', duration);
            await message.delete().catch(() => {});
            logger.warn(message.guild, 'antiSpam', `Spam detected from ${message.author.tag}`);
        }
    }
};
