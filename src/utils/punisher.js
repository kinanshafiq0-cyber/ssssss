const { PermissionsBitField } = require('discord.js');
const logger = require('./logger');
const db = require('../database/db');

class Punisher {
    async isExempt(guild, memberId) {
        const guildData = db.getGuild(guild.id);
        const exemptRoles = guildData.settings?.exemptRoles || [];
        if (exemptRoles.length === 0) return false;
        try {
            const member = await guild.members.fetch(memberId).catch(() => null);
            if (!member) return false;
            if (member.id === guild.ownerId) return true;
            return member.roles?.cache?.some(r => exemptRoles.includes(r.id)) || false;
        } catch {
            return false;
        }
    }

    async punish(guild, userId, punishment, reason, customDuration) {
        try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return false;

            if (await this.isExempt(guild, userId)) return false;

            const botMember = await guild.members.fetchMe().catch(() => null);
            if (!botMember) return false;

            const guildData = db.getGuild(guild.id);

            switch (punishment) {
                case 'warn': {
                    if (!guildData.warns) guildData.warns = {};
                    if (!guildData.warns[userId]) guildData.warns[userId] = [];
                    guildData.warns[userId].push({ reason, timestamp: Date.now() });
                    db.saveGuild(guild.id, guildData);
                    logger.action(guild, 'punishment', userId, 'WARN', reason);
                    return true;
                }

                case 'timeout': {
                    if (!member.moderatable) {
                        logger.warn(guild, 'punishment', `Cannot timeout ${userId} - insufficient permissions`);
                        return false;
                    }
                    const duration = customDuration || 300000;
                    await member.timeout(duration, reason);
                    logger.action(guild, 'punishment', userId, 'TIMEOUT', `${reason} | ${duration}ms`);
                    return true;
                }

                case 'kick': {
                    if (!member.kickable) {
                        logger.warn(guild, 'punishment', `Cannot kick ${userId} - insufficient permissions`);
                        return false;
                    }
                    await member.kick(reason);
                    logger.action(guild, 'punishment', userId, 'KICK', reason);
                    return true;
                }

                case 'ban': {
                    if (!member.bannable) {
                        logger.warn(guild, 'punishment', `Cannot ban ${userId} - insufficient permissions`);
                        return false;
                    }
                    await member.ban({ reason, deleteMessageSeconds: 86400 });
                    logger.action(guild, 'punishment', userId, 'BAN', reason);
                    return true;
                }

                case 'removeRoles': {
                    if (!member.moderatable) {
                        logger.warn(guild, 'punishment', `Cannot remove roles from ${userId} - insufficient permissions`);
                        return false;
                    }
                    const roles = member.roles.cache.filter(r => r.id !== guild.id);
                    await member.roles.remove(roles, reason);
                    logger.action(guild, 'punishment', userId, 'REMOVE_ROLES', reason);
                    return true;
                }

                case 'mute': {
                    if (!member.moderatable) {
                        logger.warn(guild, 'punishment', `Cannot mute ${userId} - insufficient permissions`);
                        return false;
                    }
                    const muteRole = guild.roles.cache.find(r => r.name === 'Muted');
                    if (muteRole) {
                        await member.roles.add(muteRole, reason);
                    }
                    await member.timeout(600000, reason);
                    logger.action(guild, 'punishment', userId, 'MUTE', reason);
                    return true;
                }
            }
        } catch (e) {
            logger.error(guild, 'punishment', `Failed to punish ${userId}: ${e.message}`);
            return false;
        }
        return false;
    }

    async punishWithLog(guild, userId, punishment, reason, system) {
        const result = await this.punish(guild, userId, punishment, reason);
        if (result) {
            db.addLog(guild.id, system || 'punishment', userId, punishment.toUpperCase(), reason);
        }
        return result;
    }
}

module.exports = new Punisher();
