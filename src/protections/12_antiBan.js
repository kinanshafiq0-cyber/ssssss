const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiBan {
    constructor(client) {
        this.name = 'antiBan';
        this.client = client;
        client.on('guildBanAdd', async (ban) => this.handle(ban));
    }

    async handle(ban) {
        if (!ban.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(ban.guild.id);
        if (!guild.settings?.antiBan?.enabled) return;

        const executor = await fetchAuditExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(ban.guild, 'antiBan', '🔨', executor.id, executor.tag, `${executor.tag} banned ${ban.user?.tag || 'a member'}`, 'danger');

        if (await punisher.isExempt(ban.guild, executor.id)) return;

        await ban.guild.members.unban(ban.user.id, 'Anti-Ban: Unauthorized ban').catch(() => {});
        logger.warn(ban.guild, 'antiBan', `${executor.tag} banned ${ban.user.tag} - unbanned`);
    }
};
