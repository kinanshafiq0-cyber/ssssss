const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiPrune {
    constructor(client) {
        this.name = 'antiPrune';
        this.client = client;
        this.cooldown = new Map();
        client.on('guildMemberRemove', async (member) => this.handle(member));
    }

    async handle(member) {
        if (!member.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(member.guild.id);
        if (!guild.settings?.antiPrune?.enabled) return;

        const executor = await fetchAuditExecutor(member.guild, AuditLogEvent.MemberPrune);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(member.guild, 'antiPrune', '✂️', executor.id, executor.tag, `${executor.tag} pruned members`, 'danger');

        if (await punisher.isExempt(member.guild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 10000);

        const punishment = guild.settings.antiPrune.punishment || 'ban';
        await punisher.punish(member.guild, executor.id, punishment, 'Unauthorized prune');
        logger.warn(member.guild, 'antiPrune', `${executor.tag} pruned members - punished`);
    }
};
