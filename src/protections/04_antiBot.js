const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

module.exports = class AntiBot {
    constructor(client) {
        this.name = 'antiBot';
        this.client = client;
        client.on('guildMemberAdd', async (member) => this.handle(member));
    }

    async handle(member) {
        if (!member.user.bot) return;
        const db = require('../database/db');
        const guild = db.getGuild(member.guild.id);
        if (!guild.settings?.antiBot?.enabled) return;

        logger.event(member.guild, 'antiBot', '🤖', member.user.id, member.user.tag, `${member.user.tag} added a bot to the server`, 'danger');

        if (await punisher.isExempt(member.guild, member.id)) return;

        const punishment = guild.settings.antiBot.punishment || 'kick';
        await punisher.punish(member.guild, member.id, punishment, 'Anti-Bot: Bot accounts not allowed');
        logger.warn(member.guild, 'antiBot', `Bot blocked: ${member.user.tag}`);
    }
};
