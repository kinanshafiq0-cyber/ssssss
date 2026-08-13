require('dotenv').config();

function required(key) {
    const val = process.env[key];
    if (!val) {
        console.error(`❌ متغير البيئة ${key} غير موجود! تأكد من ملف .env`);
        process.exit(1);
    }
    return val;
}

module.exports = {
    token: required('TOKEN'),
    ownerId: required('OWNER_ID'),
    dashboard: {
        username: process.env.DASHBOARD_USERNAME || 'Admin',
        password: required('DASHBOARD_PASSWORD'),
        port: parseInt(process.env.PORT) || 3000,
        url: process.env.DASHBOARD_URL || `http://localhost:${parseInt(process.env.PORT) || 3000}`,
        sessionSecret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex')
    },
    defaultSettings: {
        exemptRoles: [],
        punishments: {
            warn: { enabled: true, count: 3, action: 'timeout', duration: 600000 },
            timeout: { enabled: true, duration: 300000 },
            kick: { enabled: true },
            ban: { enabled: true }
        },
        antiRaid: {
            enabled: false,
            maxJoins: 5,
            timeWindow: 10000,
            punishment: 'ban'
        },
        antiSpam: {
            enabled: false,
            maxMessages: 5,
            timeWindow: 3000,
            punishment: 'timeout',
            duration: 300000
        },
        antiLink: {
            enabled: false,
            whitelistedDomains: [],
            punishment: 'timeout',
            duration: 300000
        },
        antiBot: {
            enabled: false,
            punishment: 'kick'
        },
        antiSelfbot: {
            enabled: false,
            punishment: 'ban'
        },
        antiWebhook: {
            enabled: false,
            punishment: 'ban'
        },
        antiNickname: {
            enabled: false,
            punishment: 'timeout',
            duration: 600000
        },
        antiChannelDelete: {
            enabled: false,
            punishment: 'ban'
        },
        antiChannelCreate: {
            enabled: false,
            punishment: 'ban'
        },
        antiRoleDelete: {
            enabled: false,
            punishment: 'ban'
        },
        antiRoleCreate: {
            enabled: false,
            punishment: 'ban'
        },
        antiBan: {
            enabled: false
        },
        antiKick: {
            enabled: false,
            punishment: 'ban'
        },
        antiPrune: {
            enabled: false,
            punishment: 'ban'
        },
        antiEmojiDelete: {
            enabled: false,
            punishment: 'timeout',
            duration: 300000
        },
        antiEmojiCreate: {
            enabled: false,
            punishment: 'timeout',
            duration: 300000
        },
        antiStickerDelete: {
            enabled: false,
            punishment: 'timeout',
            duration: 300000
        },
        antiStickerCreate: {
            enabled: false,
            punishment: 'timeout',
            duration: 300000
        },
        antiIntegration: {
            enabled: false,
            punishment: 'ban'
        },
        antiVanity: {
            enabled: false,
            punishment: 'ban'
        },
        antiAlts: {
            enabled: false,
            maxAge: 7,
            punishment: 'kick'
        },
        antiToxic: {
            enabled: false,
            words: [],
            punishment: 'timeout',
            duration: 300000
        },
        antiCapslock: {
            enabled: false,
            minLength: 10,
            capPercent: 70,
            punishment: 'timeout',
            duration: 60000
        },
        antiMassMention: {
            enabled: false,
            maxMentions: 5,
            punishment: 'timeout',
            duration: 300000
        },
        antiFlood: {
            enabled: false,
            maxRepeats: 3,
            timeWindow: 5000,
            punishment: 'timeout',
            duration: 300000
        },
        antiInvite: {
            enabled: false,
            whitelistedGuilds: [],
            punishment: 'timeout',
            duration: 300000
        },
        antiGhostPing: {
            enabled: false,
            punishment: 'timeout',
            duration: 300000
        },
        antiMassBan: {
            enabled: false,
            maxBans: 3,
            timeWindow: 5000,
            punishment: 'ban'
        },
        antiMassKick: {
            enabled: false,
            maxKicks: 3,
            timeWindow: 5000,
            punishment: 'ban'
        },
        antiPermissionGuard: {
            enabled: false,
            punishment: 'ban'
        }
    }
};
