const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiIntegration {
    constructor(client) {
        this.name = 'antiIntegration';
        this.client = client;
        this.cooldown = new Map();
        client.on('guildIntegrationsUpdate', async (guild) => this.handle(guild));
    }

    async handle(guild) {
        const db = require('../database/db');
        const guildData = db.getGuild(guild.id);
        if (!guildData.settings?.antiIntegration?.enabled) return;

        const executor = await fetchAuditExecutor(guild, AuditLogEvent.GuildIntegrationsUpdate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(guild, 'antiIntegration', '🔌', executor.id, executor.tag, `${executor.tag} modified an integration`, 'danger');

        if (await punisher.isExempt(guild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 10000);

        const punishment = guildData.settings.antiIntegration.punishment || 'ban';
        await punisher.punish(guild, executor.id, punishment, 'Integration modification not allowed');
        logger.warn(guild, 'antiIntegration', `${executor.tag} modified integrations - punished`);
    }
};
