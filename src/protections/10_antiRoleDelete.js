const { AuditLogEvent } = require('discord.js');
const logger = require('../utils/logger');
const punisher = require('../utils/punisher');
const restorer = require('../utils/restorer');
const { fetchAuditExecutor } = require('../utils/auditHelper');

module.exports = class AntiRoleDelete {
    constructor(client) {
        this.name = 'antiRoleDelete';
        this.client = client;
        client.on('roleDelete', async (role) => this.handle(role));
    }

    async handle(role) {
        if (!role.guild) return;
        const db = require('../database/db');
        const guildData = db.getGuild(role.guild.id);
        if (!guildData.settings?.antiRoleDelete?.enabled) return;

        const executor = await fetchAuditExecutor(role.guild, AuditLogEvent.RoleDelete);
        if (!executor || executor.id === this.client.user.id) return;

        logger.event(role.guild, 'antiRoleDelete', '🎭', executor.id, executor.tag, `${executor.tag} deleted role ${role.name}`, 'danger');

        if (await punisher.isExempt(role.guild, executor.id)) return;

        const backup = guildData.backup?.roles?.find(r => r.id === role.id);
        if (backup) {
            const newRole = await restorer.restoreRole(role.guild, role.id, backup);
            if (newRole) {
                backup.id = newRole.id;
                db.saveGuild(role.guild.id, guildData);
            }
        }

        const punishment = guildData.settings.antiRoleDelete.punishment || 'ban';
        await punisher.punish(role.guild, executor.id, punishment, `Role deletion: ${role.name}`);
        logger.warn(role.guild, 'antiRoleDelete', `${executor.tag} deleted role ${role.name} - restored & punished`);
    }
};
