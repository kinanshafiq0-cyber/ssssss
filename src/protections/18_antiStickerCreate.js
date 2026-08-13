const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiStickerCreate {
    constructor(client) {
        this.name = 'antiStickerCreate';
        this.client = client;
        this.cooldown = new Map();
        client.on('stickerCreate', async (sticker) => this.handle(sticker));
    }

    async handle(sticker) {
        if (!sticker.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(sticker.guild.id);
        if (!guild.settings?.antiStickerCreate?.enabled) return;

        const executor = await fetchAuditExecutor(sticker.guild, AuditLogEvent.StickerCreate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(sticker.guild, 'antiStickerCreate', '📝', executor.id, executor.tag, `${executor.tag} created sticker ${sticker.name}`, 'warning');

        if (await punisher.isExempt(sticker.guild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 5000);

        await sticker.delete('Anti-StickerCreate: Unauthorized').catch(() => {});

        const punishment = guild.settings.antiStickerCreate.punishment || 'timeout';
        const duration = guild.settings.antiStickerCreate.duration || 300000;
        await punisher.punish(sticker.guild, executor.id, punishment, `Unauthorized sticker creation: ${sticker.name}`, duration);
        logger.warn(sticker.guild, 'antiStickerCreate', `${executor.tag} created sticker ${sticker.name} - deleted & punished`);
    }
};
