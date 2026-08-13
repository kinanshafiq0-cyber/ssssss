const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

class Database {
    constructor() {
        this.data = {};
        this.ensureDataDir();
        this.load();
    }

    ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    load() {
        try {
            const files = fs.readdirSync(DATA_DIR);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const key = file.replace('.json', '');
                    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
                    this.data[key] = JSON.parse(content);
                }
            }
        } catch (e) {
            console.error('Database load error:', e.message);
        }
    }

    save(key) {
        try {
            if (this.data[key]) {
                fs.writeFileSync(
                    path.join(DATA_DIR, `${key}.json`),
                    JSON.stringify(this.data[key], null, 2)
                );
            }
        } catch (e) {
            console.error(`Database save error [${key}]:`, e.message);
        }
    }

    get(key, defaultValue = null) {
        if (!this.data[key]) {
            if (defaultValue === null) return null;
            this.data[key] = defaultValue;
            this.save(key);
        }
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.save(key);
    }

    update(key, path, value) {
        const data = this.get(key);
        if (!data) return;
        const keys = path.split('.');
        let current = data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.set(key, data);
    }

    getAllServers() {
        const servers = {};
        const files = fs.readdirSync(DATA_DIR);
        for (const file of files) {
            if (file.endsWith('.json') && file !== 'dashboard.json' && file !== 'backups.json') {
                const guildId = file.replace('.json', '').replace('guild_', '');
                servers[guildId] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
            }
        }
        return servers;
    }

    getGuild(guildId) {
        const key = `guild_${guildId}`;
        let data = this.get(key);
        if (!data) {
            data = {
                id: guildId,
                settings: JSON.parse(JSON.stringify(require('../../config').defaultSettings)),
                logs: [],
                backup: {
                    channels: [],
                    roles: []
                }
            };
            this.set(key, data);
        }
        return data;
    }

    saveGuild(guildId, data) {
        this.set(`guild_${guildId}`, data);
    }

    addLog(guildId, type, userId, action, details) {
        const guild = this.getGuild(guildId);
        if (!guild.logs) guild.logs = [];
        guild.logs.unshift({
            type,
            userId,
            action,
            details,
            timestamp: Date.now()
        });
        if (guild.logs.length > 500) guild.logs = guild.logs.slice(0, 500);
        this.saveGuild(guildId, guild);
    }

    getDashboard() {
        return this.get('dashboard', {
            users: [{ username: 'Admin', password: require('../../config').dashboard.password }],
            sessions: {}
        });
    }

    saveDashboard(data) {
        this.set('dashboard', data);
    }

    getTotalStats() {
        const dashboard = this.getDashboard();
        return {
            totalServers: Object.keys(this.data).filter(k => k.startsWith('guild_')).length,
            users: dashboard.users || []
        };
    }
}

module.exports = new Database();
