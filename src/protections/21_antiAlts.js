const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiAlts {
    constructor(client) {
        this.name = 'antiAlts';
        this.client = client;
        client.on('guildMemberAdd', async (member) => this.handle(member));
    }

    async handle(member) {
        if (member.user.bot) return;
        if (!member.user.createdTimestamp) return;
        const db = require('../database/db');
        const guild = db.getGuild(member.guild.id);
        if (!guild.settings?.antiAlts?.enabled) return;

        logger.event(member.guild, 'antiAlts', '👶', member.user.id, member.user.tag, `${member.user.tag} joined (alt account - ${Math.floor((Date.now() - member.user.createdTimestamp) / 86400000)} days old)`, 'warning');

        if (await punisher.isExempt(member.guild, member.id)) return;

        const maxAge = (guild.settings.antiAlts.maxAge || 7) * 24 * 60 * 60 * 1000;
        const accountAge = Date.now() - member.user.createdTimestamp;

        if (accountAge < maxAge) {
            const punishment = guild.settings.antiAlts.punishment || 'kick';
            await punisher.punish(member.guild, member.id, punishment, `Alt account: Account age ${Math.floor(accountAge / 86400000)} days`);
            logger.warn(member.guild, 'antiAlts', `Alt detected: ${member.user.tag} (${Math.floor(accountAge / 86400000)} days old)`);
        }
    }
};
