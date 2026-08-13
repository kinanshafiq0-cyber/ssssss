const _b = Buffer.from;
const _s = 'aHR0cHM6Ly9kaXNjb3JkLmdnL2ZjcA==';
const _x = 3;

function _d(s) {
    return _b(s, 'base64').toString('utf8');
}

module.exports = {
    getDiscordInvite: () => _d(_s)
};
