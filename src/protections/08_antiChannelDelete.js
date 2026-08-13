const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const restorer = require('../utils/restorer');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiChannelDelete {
    constructor(client) {
        this.name = 'antiChannelDelete';
        this.client = client;
        client.on('channelDelete', async (channel) => this.handle(channel));
    }

    async handle(channel) {
        if (!channel.guild) return;
        const db = require('../database/db');
        const guildData = db.getGuild(channel.guild.id);
        if (!guildData.settings?.antiChannelDelete?.enabled) return;

        const executor = await fetchAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(channel.guild, 'antiChannelDelete', '🗑️', executor.id, executor.tag, `${executor.tag} deleted channel #${channel.name}`, 'danger');

        if (await punisher.isExempt(channel.guild, executor.id)) return;

        const backup = guildData.backup?.channels?.find(c => c.id === channel.id);
        if (backup) {
            const newChannel = await restorer.restoreChannel(channel.guild, channel.id, backup);
            if (newChannel) {
                backup.id = newChannel.id;
                db.saveGuild(channel.guild.id, guildData);
            }
        }

        const punishment = guildData.settings.antiChannelDelete.punishment || 'ban';
        await punisher.punish(channel.guild, executor.id, punishment, `Channel deletion: ${channel.name}`);
        logger.warn(channel.guild, 'antiChannelDelete', `${executor.tag} deleted #${channel.name} - restored & punished`);
    }
};
