const AUDIT_LOG_WINDOW = 8000;

async function fetchAuditExecutor(guild, type) {
    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type });
        const entry = auditLogs.entries.first();
        if (!entry || Date.now() - entry.createdTimestamp > AUDIT_LOG_WINDOW) return null;
        return entry.executor;
    } catch {
        return null;
    }
}

module.exports = { fetchAuditExecutor, AUDIT_LOG_WINDOW };
