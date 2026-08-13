const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiGhostPing {
    constructor(client) {
        this.name = 'antiGhostPing';
        this.client = client;
        this.recentMessages = new Map();

        client.on('messageCreate', async (message) => {
            if (message.author.bot || !message.guild) return;
            const db = require('../database/db');
            const guild = db.getGuild(message.guild.id);
            if (!guild.settings?.antiGhostPing?.enabled) return;

            if (message.mentions.users.size > 0) {
                this.recentMessages.set(message.id, {
                    author: message.author.id,
                    mentions: message.mentions.users.map(u => u.id),
                    guild: message.guild.id,
                    time: Date.now()
                });
            }
        });

        client.on('messageDelete', async (message) => {
            if (message.author?.bot || !message.guild) return;
            const db = require('../database/db');
            const guild = db.getGuild(message.guild.id);
            if (!guild.settings?.antiGhostPing?.enabled) return;

            const record = this.recentMessages.get(message.id);
            if (!record || Date.now() - record.time > 10000) return;

            logger.event(message.guild, 'antiGhostPing', '👻', message.author.id, message.author.tag, `${message.author.tag} ghost pinged ${record.mentions.length} users`, 'warning');

            if (await punisher.isExempt(message.guild, message.author.id)) return;

            if (record.mentions.length > 0) {
                const punishment = guild.settings.antiGhostPing.punishment || 'timeout';
                const duration = guild.settings.antiGhostPing.duration || 300000;
                await punisher.punish(message.guild, message.author.id, punishment, `Ghost ping: ${record.mentions.length} user(s)`, duration);
                logger.warn(message.guild, 'antiGhostPing', `Ghost ping from ${message.author.tag}: ${record.mentions.length} users`);
            }

            this.recentMessages.delete(message.id);
        });
    }
};
