const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ProtectionHandler {
    constructor(client) {
        this.client = client;
        this.protections = new Map();
        this.loadProtections();
    }

    loadProtections() {
        const protectionsDir = path.join(__dirname, '../protections');
        const files = fs.readdirSync(protectionsDir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const Protection = require(path.join(protectionsDir, file));
                const protection = new Protection(this.client);
                this.protections.set(protection.name, protection);
                logger.log(null, 'system', `Loaded protection: ${protection.name}`);
            } catch (e) {
                logger.error(null, 'system', `Failed to load protection ${file}: ${e.message}`);
            }
        }
    }

    isEnabled(guildId, system) {
        const db = require('../database/db');
        const guild = db.getGuild(guildId);
        if (!guild.settings) return false;
        if (!guild.settings[system]) return false;
        return guild.settings[system].enabled === true;
    }

    getSetting(guildId, system, key) {
        const db = require('../database/db');
        const guild = db.getGuild(guildId);
        if (!guild.settings || !guild.settings[system]) return null;
        return guild.settings[system][key];
    }

    getPunishment(guildId, system) {
        const db = require('../database/db');
        const guild = db.getGuild(guildId);
        if (!guild.settings || !guild.settings[system]) return 'timeout';
        return guild.settings[system].punishment || 'timeout';
    }

    toggleProtection(guildId, system, enabled) {
        const db = require('../database/db');
        const guild = db.getGuild(guildId);
        if (!guild.settings[system]) guild.settings[system] = {};
        guild.settings[system].enabled = enabled;
        db.saveGuild(guildId, guild);
        logger.log(null, 'system', `Protection ${system} ${enabled ? 'enabled' : 'disabled'} for guild ${guildId}`);
        return true;
    }

    updateSetting(guildId, system, key, value) {
        const db = require('../database/db');
        const guild = db.getGuild(guildId);
        if (!guild.settings[system]) guild.settings[system] = {};
        guild.settings[system][key] = value;
        db.saveGuild(guildId, guild);
        return true;
    }

    getSystemStatus(guildId) {
        const db = require('../database/db');
        const guild = db.getGuild(guildId);
        if (!guild.settings) return {};

        const status = {};
        for (const [key, value] of Object.entries(guild.settings)) {
            status[key] = value.enabled || false;
        }
        return status;
    }
}

module.exports = ProtectionHandler;
