const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiEmojiCreate {
    constructor(client) {
        this.name = 'antiEmojiCreate';
        this.client = client;
        this.cooldown = new Map();
        client.on('emojiCreate', async (emoji) => this.handle(emoji));
    }

    async handle(emoji) {
        if (!emoji.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(emoji.guild.id);
        if (!guild.settings?.antiEmojiCreate?.enabled) return;

        const executor = await fetchAuditExecutor(emoji.guild, AuditLogEvent.EmojiCreate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(emoji.guild, 'antiEmojiCreate', '😊', executor.id, executor.tag, `${executor.tag} created emoji ${emoji.name}`, 'warning');

        if (await punisher.isExempt(emoji.guild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 5000);

        await emoji.delete('Anti-EmojiCreate: Unauthorized').catch(() => {});

        const punishment = guild.settings.antiEmojiCreate.punishment || 'timeout';
        const duration = guild.settings.antiEmojiCreate.duration || 300000;
        await punisher.punish(emoji.guild, executor.id, punishment, `Unauthorized emoji creation: ${emoji.name}`, duration);
        logger.warn(emoji.guild, 'antiEmojiCreate', `${executor.tag} created emoji ${emoji.name} - deleted & punished`);
    }
};
