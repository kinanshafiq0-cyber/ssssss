const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./src/database/db');
const logger = require('./src/utils/logger');
const settings = require('./src/utils/settings');

const loginAttempts = new Map();

const app = express();

let botClient = null;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'dashboard/views'));
app.use(express.static(path.join(__dirname, 'dashboard/public')));

function requireAuth(req, res, next) {
    if (!req.session.authenticated) {
        return res.redirect('/login');
    }
    next();
}

app.get('/login', (req, res) => {
    if (req.session.authenticated) return res.redirect('/');
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!loginAttempts.has(ip)) loginAttempts.set(ip, []);
    const attempts = loginAttempts.get(ip).filter(t => now - t < 60000);
    if (attempts.length >= 5) {
        return res.render('login', { error: '❌ محاولات كثيرة! انتظر دقيقة' });
    }

    const { username, password } = req.body;
    if (username === config.dashboard.username && password === config.dashboard.password) {
        loginAttempts.delete(ip);
        req.session.authenticated = true;
        req.session.username = username;
        return res.redirect('/');
    }

    attempts.push(now);
    loginAttempts.set(ip, attempts);
    res.render('login', { error: '❌ اسم المستخدم أو كلمة المرور خطأ' });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', requireAuth, async (req, res) => {
    try {
        const servers = [];
        if (botClient) {
            for (const guild of botClient.guilds.cache.values()) {
                const guildData = db.getGuild(guild.id);
                servers.push({
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL({ size: 64 }),
                    memberCount: guild.memberCount,
                    protectionStatus: guildData.settings || {},
                    ownerId: guild.ownerId,
                    isOwner: guild.ownerId === config.ownerId
                });
            }
        }
        res.render('index', {
            username: req.session.username,
            servers,
            totalServers: servers.length,
            discordInvite: settings.getDiscordInvite()
        });
    } catch (e) {
        res.status(500).send('Server error');
    }
});

app.get('/server/:id', requireAuth, async (req, res) => {
    try {
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).send('Server not found');

        const guildData = db.getGuild(guild.id);
        res.render('server', {
            guild: {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL({ size: 128 }),
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                isOwner: guild.ownerId === config.ownerId
            },
            settings: guildData.settings || {},
            logs: (guildData.logs || []).slice(0, 100),
            backup: guildData.backup || { channels: [], roles: [] },
            username: req.session.username,
            defaultSettings: config.defaultSettings,
            discordInvite: settings.getDiscordInvite(),
            guildRoles: guild.roles.cache
                .filter(r => r.id !== guild.id)
                .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
                .sort((a, b) => a.name.localeCompare(b.name))
        });
    } catch (e) {
        res.status(500).send('Server error');
    }
});

app.post('/api/server/:id/toggle', requireAuth, async (req, res) => {
    try {
        const { system, enabled } = req.body;
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });

        const guildData = db.getGuild(guild.id);
        if (system === 'all') {
            for (const key of Object.keys(guildData.settings)) {
                guildData.settings[key].enabled = enabled;
            }
        } else {
            if (!guildData.settings[system]) {
                guildData.settings[system] = { enabled: false };
            }
            guildData.settings[system].enabled = enabled;
        }
        db.saveGuild(guild.id, guildData);
        logger.log(guild, 'dashboard', `${system} ${enabled ? 'enabled' : 'disabled'} by ${req.session.username}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/server/:id/setting', requireAuth, async (req, res) => {
    try {
        const { system, key, value, settings } = req.body;
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });

        const guildData = db.getGuild(guild.id);
        if (!guildData.settings[system]) guildData.settings[system] = {};

        if (settings && typeof settings === 'object') {
            Object.assign(guildData.settings[system], settings);
            db.saveGuild(guild.id, guildData);
            logger.log(guild, 'dashboard', `Settings updated for ${system} by ${req.session.username}`);
        } else if (key !== undefined) {
            guildData.settings[system][key] = value;
            db.saveGuild(guild.id, guildData);
            logger.log(guild, 'dashboard', `Setting ${system}.${key} = ${value} by ${req.session.username}`);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/server/:id/beast', requireAuth, async (req, res) => {
    try {
        const { settings } = req.body;
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });

        const guildData = db.getGuild(guild.id);
        for (const [system, config] of Object.entries(settings)) {
            if (!guildData.settings[system]) guildData.settings[system] = {};
            Object.assign(guildData.settings[system], config);
        }
        db.saveGuild(guild.id, guildData);
        logger.log(guild, 'dashboard', `👹 Beast mode activated by ${req.session.username}`);
        res.json({ success: true, message: 'Beast mode activated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/server/:id/exempt-roles', requireAuth, async (req, res) => {
    try {
        const { roles } = req.body;
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });

        const guildData = db.getGuild(guild.id);
        if (Array.isArray(roles)) {
            guildData.settings.exemptRoles = roles;
        } else {
            guildData.settings.exemptRoles = [];
        }
        db.saveGuild(guild.id, guildData);
        logger.log(guild, 'dashboard', `Exempt roles updated by ${req.session.username}`);
        res.json({ success: true, message: 'Exempt roles updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/server/:id/logs', requireAuth, async (req, res) => {
    try {
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });
        const guildData = db.getGuild(guild.id);
        res.json({ logs: (guildData.logs || []).slice(0, 200) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/server/:id/backup', requireAuth, async (req, res) => {
    try {
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });
        const restorer = require('./src/utils/restorer');
        await restorer.backupAll(guild);
        res.json({ success: true, message: '✅ تم عمل نسخة احتياطية' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const stats = {
            totalServers: botClient?.guilds.cache.size || 0,
            totalUsers: botClient?.guilds.cache.reduce((a, g) => a + g.memberCount, 0) || 0,
            uptime: process.uptime(),
            version: require('./package.json').version,
            dashboardUsers: db.getDashboard().users.length
        };
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/server/:id/punish', requireAuth, async (req, res) => {
    try {
        const { userId, punishment, reason } = req.body;
        const guild = botClient?.guilds.cache.get(req.params.id);
        if (!guild) return res.status(404).json({ error: 'Server not found' });

        const punisher = require('./src/utils/punisher');
        await punisher.punish(guild, userId, punishment, reason);
        logger.log(guild, 'dashboard', `Manual punish: ${userId} - ${punishment} by ${req.session.username}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

function start(client) {
    botClient = client;
    const port = config.dashboard.port;
    app.listen(port, '0.0.0.0', () => {
        logger.log(null, 'system', `🌐 Dashboard running on http://localhost:${port}`);
    });
}

module.exports = { start, app };
