const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiRoleCreate {
    constructor(client) {
        this.name = 'antiRoleCreate';
        this.client = client;
        this.cooldown = new Map();
        client.on('roleCreate', async (role) => this.handle(role));
    }

    async handle(role) {
        if (!role.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(role.guild.id);
        if (!guild.settings?.antiRoleCreate?.enabled) return;

        const executor = await fetchAuditExecutor(role.guild, AuditLogEvent.RoleCreate);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(role.guild, 'antiRoleCreate', '✨', executor.id, executor.tag, `${executor.tag} created role ${role.name}`, 'danger');

        if (await punisher.isExempt(role.guild, executor.id)) return;

        if (this.cooldown.has(executor.id)) return;
        this.cooldown.set(executor.id, Date.now());
        setTimeout(() => this.cooldown.delete(executor.id), 5000);

        await role.delete('Anti-RoleCreate: Unauthorized').catch(() => {});

        const punishment = guild.settings.antiRoleCreate.punishment || 'ban';
        await punisher.punish(role.guild, executor.id, punishment, `Unauthorized role creation: ${role.name}`);
        logger.warn(role.guild, 'antiRoleCreate', `${executor.tag} created role ${role.name} - deleted & punished`);
    }
};
