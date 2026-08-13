const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiChannelCreate {
    constructor(client) {
        this.name = 'antiChannelCreate';
        this.client = client;
        this.cooldown = new Map();
        client.on('channelCreate', async (channel) => this.handle(channel));
    }

    async handle(channel) {
        if (!channel.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(channel.guild.id);
        if (!guild.settings?.antiChannelCreate?.enabled) return;

        const executor = await fetchAuditExecutor(channel.guild, AuditLogEvent.ChannelCreate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(channel.guild, 'antiChannelCreate', '➕', executor.id, executor.tag, `${executor.tag} created channel #${channel.name}`, 'danger');

        if (await punisher.isExempt(channel.guild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 5000);

        await channel.delete('Anti-ChannelCreate: Unauthorized').catch(() => {});

        const punishment = guild.settings.antiChannelCreate.punishment || 'ban';
        await punisher.punish(channel.guild, executor.id, punishment, `Unauthorized channel creation: ${channel.name}`);
        logger.warn(channel.guild, 'antiChannelCreate', `${executor.tag} created #${channel.name} - deleted & punished`);
    }
};
