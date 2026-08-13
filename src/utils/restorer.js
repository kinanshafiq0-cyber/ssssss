const logger = require('./logger');
const db = require('../database/db');

class Restorer {
    async restoreChannel(guild, channelId, channelData) {
        try {
            if (!channelData) {
                const guildData = db.getGuild(guild.id);
                if (!guildData.backup || !guildData.backup.channels) return null;
                channelData = guildData.backup.channels.find(c => c.id === channelId);
                if (!channelData) return null;
            }

            const newChannel = await guild.channels.create({
                name: channelData.name,
                type: channelData.type,
                topic: channelData.topic || null,
                nsfw: channelData.nsfw || false,
                bitrate: channelData.bitrate,
                userLimit: channelData.userLimit,
                rateLimitPerUser: channelData.rateLimitPerUser,
                parent: channelData.parent,
                permissionOverwrites: channelData.permissionOverwrites
            });

            logger.action(guild, 'restorer', 'system', 'CHANNEL_RESTORED', `Channel ${channelData.name} restored as ${newChannel.id}`);
            return newChannel;
        } catch (e) {
            logger.error(guild, 'restorer', `Failed to restore channel: ${e.message}`);
            return null;
        }
    }

    async restoreRole(guild, roleId, roleData) {
        try {
            if (!roleData) {
                const guildData = db.getGuild(guild.id);
                if (!guildData.backup || !guildData.backup.roles) return null;
                roleData = guildData.backup.roles.find(r => r.id === roleId);
                if (!roleData) return null;
            }

            const newRole = await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                hoist: roleData.hoist,
                permissions: roleData.permissions,
                mentionable: roleData.mentionable,
                icon: roleData.icon
            });

            logger.action(guild, 'restorer', 'system', 'ROLE_RESTORED', `Role ${roleData.name} restored as ${newRole.id}`);
            return newRole;
        } catch (e) {
            logger.error(guild, 'restorer', `Failed to restore role: ${e.message}`);
            return null;
        }
    }

    async backupAll(guild) {
        try {
            const guildData = db.getGuild(guild.id);
            guildData.backup = {
                channels: guild.channels.cache.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    topic: c.topic,
                    nsfw: c.nsfw,
                    bitrate: c.bitrate,
                    userLimit: c.userLimit,
                    rateLimitPerUser: c.rateLimitPerUser,
                    parent: c.parentId,
                    position: c.position,
                    permissionOverwrites: c.permissionOverwrites.cache.map(o => ({
                        id: o.id,
                        type: o.type,
                        allow: o.allow.bitfield,
                        deny: o.deny.bitfield
                    }))
                })),
                roles: guild.roles.cache.filter(r => r.id !== guild.id).map(r => ({
                    id: r.id,
                    name: r.name,
                    color: r.color,
                    hoist: r.hoist,
                    position: r.position,
                    permissions: r.permissions.bitfield,
                    mentionable: r.mentionable,
                    icon: r.icon
                })),
                timestamp: Date.now()
            };
            db.saveGuild(guild.id, guildData);
            logger.log(guild, 'backup', `Backup created for ${guild.name} - ${guildData.backup.channels.length} channels, ${guildData.backup.roles.length} roles`);
            return true;
        } catch (e) {
            logger.error(guild, 'backup', `Failed to create backup: ${e.message}`);
            return false;
        }
    }

    async backupChannels(guild) {
        try {
            const guildData = db.getGuild(guild.id);
            if (!guildData.backup) guildData.backup = { channels: [], roles: [], timestamp: Date.now() };
            guildData.backup.channels = guild.channels.cache.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                topic: c.topic,
                nsfw: c.nsfw,
                bitrate: c.bitrate,
                userLimit: c.userLimit,
                rateLimitPerUser: c.rateLimitPerUser,
                parent: c.parentId,
                position: c.position,
                permissionOverwrites: c.permissionOverwrites.cache.map(o => ({
                    id: o.id,
                    type: o.type,
                    allow: o.allow.bitfield,
                    deny: o.deny.bitfield
                }))
            }));
            guildData.backup.timestamp = Date.now();
            db.saveGuild(guild.id, guildData);
            return true;
        } catch (e) {
            logger.error(guild, 'backup', `Failed to backup channels: ${e.message}`);
            return false;
        }
    }

    async backupRoles(guild) {
        try {
            const guildData = db.getGuild(guild.id);
            if (!guildData.backup) guildData.backup = { channels: [], roles: [], timestamp: Date.now() };
            guildData.backup.roles = guild.roles.cache.filter(r => r.id !== guild.id).map(r => ({
                id: r.id,
                name: r.name,
                color: r.color,
                hoist: r.hoist,
                position: r.position,
                permissions: r.permissions.bitfield,
                mentionable: r.mentionable,
                icon: r.icon
            }));
            guildData.backup.timestamp = Date.now();
            db.saveGuild(guild.id, guildData);
            return true;
        } catch (e) {
            logger.error(guild, 'backup', `Failed to backup roles: ${e.message}`);
            return false;
        }
    }
}

module.exports = new Restorer();
