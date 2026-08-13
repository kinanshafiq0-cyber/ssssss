const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiKick {
    constructor(client) {
        this.name = 'antiKick';
        this.client = client;
        client.on('guildMemberRemove', async (member) => this.handle(member));
    }

    async handle(member) {
        if (!member.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(member.guild.id);
        if (!guild.settings?.antiKick?.enabled) return;

        const executor = await fetchAuditExecutor(member.guild, AuditLogEvent.MemberKick);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(member.guild, 'antiKick', '👢', executor.id, executor.tag, `${executor.tag} kicked a member`, 'danger');

        if (await punisher.isExempt(member.guild, executor.id)) return;

        const punishment = guild.settings.antiKick.punishment || 'ban';
        await punisher.punish(member.guild, executor.id, punishment, `Unauthorized kick: ${member.user.tag}`);
        logger.warn(member.guild, 'antiKick', `${executor.tag} kicked ${member.user.tag} - punished`);
    }
};
