const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiRaid {
    constructor(client) {
        this.name = 'antiRaid';
        this.client = client;
        this.joinCache = new Map();
        client.on('guildMemberAdd', async (member) => this.handle(member));
    }

    async handle(member) {
        if (member.user.bot) return;
        const db = require('../database/db');
        const guild = db.getGuild(member.guild.id);
        if (!guild.settings?.antiRaid?.enabled) return;

        logger.event(member.guild, 'antiRaid', '⚔️', member.user.id, member.user.tag, `${member.user.tag} triggered raid alert (member joins detected)`, 'danger');

        if (await punisher.isExempt(member.guild, member.id)) return;

        const now = Date.now();
        if (!this.joinCache.has(member.guild.id)) {
            this.joinCache.set(member.guild.id, []);
        }

        const joins = this.joinCache.get(member.guild.id);
        const timeWindow = guild.settings.antiRaid.timeWindow || 10000;
        const maxJoins = guild.settings.antiRaid.maxJoins || 5;

        joins.push({ id: member.id, time: now });
        const recentJoins = joins.filter(j => now - j.time < timeWindow);
        this.joinCache.set(member.guild.id, recentJoins);

        if (recentJoins.length > maxJoins) {
            const punishment = guild.settings.antiRaid.punishment || 'ban';
            await punisher.punish(member.guild, member.id, punishment, 'Raid detection: Excessive joins');
            logger.warn(member.guild, 'antiRaid', `Raid detected! ${recentJoins.length} joins in window. Punished ${member.user.tag}`);
        }
    }
};
