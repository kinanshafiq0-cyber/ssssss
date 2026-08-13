const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiStickerDelete {
    constructor(client) {
        this.name = 'antiStickerDelete';
        this.client = client;
        client.on('stickerDelete', async (sticker) => this.handle(sticker));
    }

    async handle(sticker) {
        if (!sticker.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(sticker.guild.id);
        if (!guild.settings?.antiStickerDelete?.enabled) return;

        const executor = await fetchAuditExecutor(sticker.guild, AuditLogEvent.StickerDelete);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(sticker.guild, 'antiStickerDelete', '🏷️', executor.id, executor.tag, `${executor.tag} deleted sticker ${sticker.name}`, 'warning');

        if (await punisher.isExempt(sticker.guild, executor.id)) return;

        const punishment = guild.settings.antiStickerDelete.punishment || 'timeout';
        const duration = guild.settings.antiStickerDelete.duration || 300000;
        await punisher.punish(sticker.guild, executor.id, punishment, `Sticker deletion: ${sticker.name}`, duration);
        logger.warn(sticker.guild, 'antiStickerDelete', `${executor.tag} deleted sticker ${sticker.name} - punished`);
    }
};
