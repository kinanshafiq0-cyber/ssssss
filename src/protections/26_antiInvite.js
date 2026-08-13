const logger = require('../utils/logger');
const punisher = require('../utils/punisher');

const DISCORD_INVITE_REGEX = /(?:discord\.(?:gg|io|me|com)\/)([a-zA-Z0-9]+)/gi;

module.exports = class AntiInvite {
    constructor(client) {
        this.name = 'antiInvite';
        this.client = client;
        client.on('messageCreate', async (message) => this.handle(message));
    }

    async handle(message) {
        if (message.author.bot || !message.guild) return;
        const db = require('../database/db');
        const guild = db.getGuild(message.guild.id);
        if (!guild.settings?.antiInvite?.enabled) return;

        logger.event(message.guild, 'antiInvite', '📩', message.author.id, message.author.tag, `${message.author.tag} sent a server invite`, 'warning');

        if (await punisher.isExempt(message.guild, message.author.id)) return;

        const invites = message.content.match(DISCORD_INVITE_REGEX);
        if (!invites) return;

        const whitelisted = guild.settings.antiInvite?.whitelistedGuilds || [];

        for (const invite of invites) {
            try {
                const code = invite.split('/').pop();
                const fetched = await this.client.fetchInvite(code).catch(() => null);
                if (!fetched) continue;

                if (!whitelisted.includes(fetched.guild?.id)) {
                    const punishment = guild.settings.antiInvite.punishment || 'timeout';
                    const duration = guild.settings.antiInvite.duration || 300000;
                    await message.delete().catch(() => {});
                    await punisher.punish(message.guild, message.author.id, punishment, `Server invite not allowed: ${fetched.guild?.name || 'unknown'}`, duration);
                    logger.warn(message.guild, 'antiInvite', `Invite blocked from ${message.author.tag}: ${fetched.guild?.name}`);
                    return;
                }
            } catch {
                continue;
            }
        }
    }
};
