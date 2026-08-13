const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiVanity {
    constructor(client) {
        this.name = 'antiVanity';
        this.client = client;
        this.cooldown = new Map();
        client.on('guildUpdate', async (oldGuild, newGuild) => this.handle(oldGuild, newGuild));
    }

    async handle(oldGuild, newGuild) {
        const db = require('../database/db');
        const guildData = db.getGuild(newGuild.id);
        if (!guildData.settings?.antiVanity?.enabled) return;

        if (oldGuild.vanityURLCode === newGuild.vanityURLCode) return;

        const executor = await fetchAuditExecutor(newGuild, AuditLogEvent.GuildUpdate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(newGuild, 'antiVanity', '💫', executor.id, executor.tag, `${executor.tag} changed vanity URL`, 'danger');

        if (await punisher.isExempt(newGuild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 30000);

        try {
            await newGuild.setVanityURL(oldGuild.vanityURLCode || '');
        } catch {}

        const punishment = guildData.settings.antiVanity.punishment || 'ban';
        await punisher.punish(newGuild, executor.id, punishment, 'Vanity URL modification not allowed');
        logger.warn(newGuild, 'antiVanity', `${executor.tag} changed vanity URL - restored & punished`);
    }
};
