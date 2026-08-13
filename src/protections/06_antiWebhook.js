const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiWebhook {
    constructor(client) {
        this.name = 'antiWebhook';
        this.client = client;
        client.on('webhookUpdate', async (channel) => this.handle(channel));
    }

    async handle(channel) {
        const db = require('../database/db');
        const guild = db.getGuild(channel.guild.id);
        if (!guild.settings?.antiWebhook?.enabled) return;

        const executor = await fetchAuditExecutor(channel.guild, AuditLogEvent.WebhookCreate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(channel.guild, 'antiWebhook', '🪝', executor.id, executor.tag, `${executor.tag} created a webhook`, 'danger');

        if (await punisher.isExempt(channel.guild, executor.id)) return;

        const punishment = guild.settings.antiWebhook.punishment || 'ban';
        await punisher.punish(channel.guild, executor.id, punishment, 'Webhook creation not allowed');

        const webhooks = await channel.fetchWebhooks().catch(() => null);
        if (webhooks) {
            for (const webhook of webhooks.values()) {
                await webhook.delete().catch(() => {});
            }
        }

        logger.warn(channel.guild, 'antiWebhook', `Webhook blocked from ${executor.tag}`);
    }
};
