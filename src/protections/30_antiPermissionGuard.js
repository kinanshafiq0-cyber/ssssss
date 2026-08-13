const { AuditLogEvent, PermissionsBitField } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiPermissionGuard {
    constructor(client) {
        this.name = 'antiPermissionGuard';
        this.client = client;
        this.cooldown = new Map();
        client.on('guildUpdate', async (oldGuild, newGuild) => this.handleGuild(oldGuild, newGuild));
    }

    async handleGuild(oldGuild, newGuild) {
        const db = require('../database/db');
        const guild = db.getGuild(newGuild.id);
        if (!guild.settings?.antiPermissionGuard?.enabled) return;

        if (oldGuild.roles.everyone.permissions.bitfield === newGuild.roles.everyone.permissions.bitfield) return;

        const executor = await fetchAuditExecutor(newGuild, AuditLogEvent.GuildUpdate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(newGuild, 'antiPermissionGuard', '🔐', executor.id, executor.tag, `${executor.tag} modified server permissions`, 'danger');

        if (await punisher.isExempt(newGuild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 10000);

        try {
            const newPerms = new PermissionsBitField(oldGuild.roles.everyone.permissions.bitfield);
            await newGuild.roles.everyone.setPermissions(newPerms);
        } catch {}

        const punishment = guild.settings.antiPermissionGuard.punishment || 'ban';
        await punisher.punish(newGuild, executor.id, punishment, 'Permission modification not allowed');
        logger.warn(newGuild, 'antiPermissionGuard', `${executor.tag} modified server permissions - restored & punished`);
    }
};
