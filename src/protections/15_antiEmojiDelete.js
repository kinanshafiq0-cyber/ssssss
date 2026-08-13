const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiEmojiDelete {
    constructor(client) {
        this.name = 'antiEmojiDelete';
        this.client = client;
        client.on('emojiDelete', async (emoji) => this.handle(emoji));
    }

    async handle(emoji) {
        if (!emoji.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(emoji.guild.id);
        if (!guild.settings?.antiEmojiDelete?.enabled) return;

        const executor = await fetchAuditExecutor(emoji.guild, AuditLogEvent.EmojiDelete);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(emoji.guild, 'antiEmojiDelete', '😭', executor.id, executor.tag, `${executor.tag} deleted emoji ${emoji.name}`, 'warning');

        if (await punisher.isExempt(emoji.guild, executor.id)) return;

        const punishment = guild.settings.antiEmojiDelete.punishment || 'timeout';
        const duration = guild.settings.antiEmojiDelete.duration || 300000;
        await punisher.punish(emoji.guild, executor.id, punishment, `Emoji deletion: ${emoji.name}`, duration);
        logger.warn(emoji.guild, 'antiEmojiDelete', `${executor.tag} deleted emoji ${emoji.name} - punished`);
    }
};
