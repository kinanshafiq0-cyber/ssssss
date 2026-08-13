const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiNickname {
    constructor(client) {
        this.name = 'antiNickname';
        this.client = client;
        this.nicknameCache = new Map();
        client.on('guildMemberUpdate', async (oldMember, newMember) => this.handle(oldMember, newMember));
    }

    async handle(oldMember, newMember) {
        if (!newMember.guild || newMember.user.bot) return;
        const db = require('../database/db');
        const guild = db.getGuild(newMember.guild.id);
        if (!guild.settings?.antiNickname?.enabled) return;

        if (oldMember?.nickname === newMember.nickname) return;

        const executor = await fetchAuditExecutor(newMember.guild, AuditLogEvent.MemberUpdate);
        if (!executor || executor.id === this.client.user.id || executor.id === newMember.id) return;

        logger.event(newMember.guild, 'antiNickname', '✏️', executor.id, executor.tag, `${executor.tag} changed nickname of ${newMember.user.tag} (${oldMember?.nickname || 'none'} → ${newMember.nickname || 'none'})`, 'warning');

        if (await punisher.isExempt(newMember.guild, executor.id)) return;

        const punishment = guild.settings.antiNickname.punishment || 'timeout';
        const duration = guild.settings.antiNickname.duration || 600000;

        if (oldMember?.nickname) {
            await newMember.setNickname(oldMember.nickname, 'Anti-Nickname: Restored').catch(() => {});
        }

        await punisher.punish(newMember.guild, executor.id, punishment, 'Nickname change not allowed', duration);
        logger.warn(newMember.guild, 'antiNickname', `${executor.tag} changed nickname of ${newMember.user.tag} - punished`);
    }
};
