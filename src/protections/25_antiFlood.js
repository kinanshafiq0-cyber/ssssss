const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

const CLEANUP_INTERVAL = 60000;

module.exports = class AntiFlood {
    constructor(client) {
        this.name = 'antiFlood';
        this.client = client;
        this.messageHistory = new Map();
        client.on('messageCreate', async (message) => this.handle(message));
        setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, history] of this.messageHistory) {
            const recent = history.filter(m => now - m.time < 10000);
            if (recent.length === 0) this.messageHistory.delete(key);
            else this.messageHistory.set(key, recent);
        }
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiFlood?.enabled) return;

        logger.event(message.guild, 'antiFlood', '🌊', message.author.id, message.author.tag, `${message.author.tag} flooding in #${message.channel.name}`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const key = `${message.author.id}-${message.guild.id}`;
        const timeWindow = guild.settings.antiFlood.timeWindow || 5000;
        const maxRepeats = guild.settings.antiFlood.maxRepeats || 3;

        if (!this.messageHistory.has(key)) {
            this.messageHistory.set(key, []);
        }

        const history = this.messageHistory.get(key);
        history.push({ content: message.content, time: Date.now() });

        const recent = history.filter(m => Date.now() - m.time < timeWindow);
        this.messageHistory.set(key, recent);

        const sameContent = recent.filter(m => m.content === message.content);
        if (sameContent.length > maxRepeats) {
            const punishment = guild.settings.antiFlood.punishment || 'timeout';
            const duration = guild.settings.antiFlood.duration || 300000;
            await message.delete().catch(() => {});
            await punisher.punish(message.guild, message.author.id, punishment, `Flood detected: Same message ${sameContent.length} times`, duration);
            logger.warn(message.guild, 'antiFlood', `Flood from ${message.author.tag}: repeated ${sameContent.length}x`);
        }
    }
};
