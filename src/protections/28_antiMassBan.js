const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiMassBan {
    constructor(client) {
        this.name = 'antiMassBan';
        this.client = client;
        this.banCache = new Map();
        client.on('guildBanAdd', async (ban) => this.handle(ban));
    }

    async handle(ban) {
        if (!ban.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(ban.guild.id);
        if (!guild.settings?.antiMassBan?.enabled) return;

        const executor = await fetchAuditExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(ban.guild, 'antiMassBan', '💥', executor.id, executor.tag, `${executor.tag} mass banned members`, 'danger');

        if (await punisher.isExempt(ban.guild, executor.id)) return;

        if (!this.banCache.has(executor.id)) {
            this.banCache.set(executor.id, []);
        }

        const bans = this.banCache.get(executor.id);
        const timeWindow = guild.settings.antiMassBan.timeWindow || 5000;
        const maxBans = guild.settings.antiMassBan.maxBans || 3;

        bans.push({ userId: ban.user.id, time: Date.now() });
        const recent = bans.filter(b => Date.now() - b.time < timeWindow);
        this.banCache.set(executor.id, recent);

        if (recent.length > maxBans) {
            await ban.guild.members.unban(ban.user.id, 'Anti-MassBan: Restored').catch(() => {});
            const punishment = guild.settings.antiMassBan.punishment || 'ban';
            await punisher.punish(ban.guild, executor.id, punishment, 'Mass ban detected');
            logger.warn(ban.guild, 'antiMassBan', `Mass ban detected from ${executor.tag}: ${recent.length} bans`);
        }
    }
};
