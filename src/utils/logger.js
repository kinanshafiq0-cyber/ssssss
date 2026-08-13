const db = require('../database/db');

function timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

class Logger {
    log(guild, type, message) {
        const ts = timestamp();
        console.log(`[${ts}] [${type.toUpperCase()}] ${message}`);
        if (guild) {
            db.addLog(guild.id, type, 'system', message, null);
        }
    }

    warn(guild, type, message) {
        const ts = timestamp();
        console.warn(`[${ts}] [${type.toUpperCase()}] ⚠ ${message}`);
        if (guild) {
            db.addLog(guild.id, type, 'system', `⚠ ${message}`, null);
        }
    }

    error(guild, type, message) {
        const ts = timestamp();
        console.error(`[${ts}] [${type.toUpperCase()}] ❌ ${message}`);
        if (guild) {
            db.addLog(guild.id, type, 'system', `❌ ${message}`, null);
        }
    }

    action(guild, type, userId, action, details) {
        const ts = timestamp();
        console.log(`[${ts}] [${type.toUpperCase()}] 🔨 ${action} -> ${userId} | ${details}`);
        if (guild) {
            db.addLog(guild.id, type, userId, action, details);
        }
    }

    event(guild, system, icon, userId, userTag, description, severity = 'warning') {
        const ts = timestamp();
        console.log(`[${ts}] [${system.toUpperCase()}] ${icon} ${description} | ${userTag}`);
        if (guild) {
            db.addLog(guild.id, system, userId, {
                icon,
                userTag,
                description,
                severity
            });
        }
    }
}

module.exports = new Logger();
