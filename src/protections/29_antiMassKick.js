const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiMassKick {
    constructor(client) {
        this.name = 'antiMassKick';
        this.client = client;
        this.kickCache = new Map();
        client.on('guildMemberRemove', async (member) => this.handle(member));
    }

    async handle(member) {
        if (!member.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(member.guild.id);
        if (!guild.settings?.antiMassKick?.enabled) return;

        const executor = await fetchAuditExecutor(member.guild, AuditLogEvent.MemberKick);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(member.guild, 'antiMassKick', '🦵', executor.id, executor.tag, `${executor.tag} mass kicked members`, 'danger');

        if (await punisher.isExempt(member.guild, executor.id)) return;

        if (!this.kickCache.has(executor.id)) {
            this.kickCache.set(executor.id, []);
        }

        const kicks = this.kickCache.get(executor.id);
        const timeWindow = guild.settings.antiMassKick.timeWindow || 5000;
        const maxKicks = guild.settings.antiMassKick.maxKicks || 3;

        kicks.push({ userId: member.id, time: Date.now() });
        const recent = kicks.filter(k => Date.now() - k.time < timeWindow);
        this.kickCache.set(executor.id, recent);

        if (recent.length > maxKicks) {
            const punishment = guild.settings.antiMassKick.punishment || 'ban';
            await punisher.punish(member.guild, executor.id, punishment, 'Mass kick detected');
            logger.warn(member.guild, 'antiMassKick', `Mass kick detected from ${executor.tag}: ${recent.length} kicks`);
        }
    }
};
