/**
 * Logger structuré (Pino) pour le website backend.
 * Niveau : LOG_LEVEL (défaut info en prod, debug sinon).
 * Fichier : si LOG_PATH est défini, écriture dans <LOG_PATH>/app.log en plus de stdout.
 */
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
const logPath = process.env.LOG_PATH;

const streams = [{ stream: process.stdout }];

if (logPath && String(logPath).trim()) {
  const dir = path.isAbsolute(logPath) ? logPath : path.join(process.cwd(), logPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "app.log");
    streams.push({ stream: pino.destination({ dest: filePath, append: true }) });
  } catch (err) {
    process.stdout.write(`[logger] Impossible de créer le répertoire de logs: ${err.message}\n`);
  }
}

const dest = streams.length > 1 ? pino.multistream(streams) : process.stdout;
const logger = pino(
  {
    level,
    base: null,
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  dest
);

/**
 * Retourne un enfant logger avec requestId (à utiliser dans les middlewares / contrôleurs).
 * @param {string} requestId
 * @returns {pino.Logger}
 */
function child(requestId) {
  return requestId ? logger.child({ requestId }) : logger;
}

module.exports = { logger, child };
