import * as Sentry from '@sentry/nextjs';

type Extra = Record<string, any> | undefined;

export const logger = {
    info: (msg: string, extra?: Extra) => {
        if (extra) console.info(msg, extra); else console.info(msg);
    },
    warn: (msg: string, extra?: Extra) => {
        if (extra) console.warn(msg, extra); else console.warn(msg);
        if (process.env.NODE_ENV === 'production') {
            Sentry.captureMessage(msg, { level: 'warning', extra });
        }
    },
    error: (msg: string, extra?: Extra) => {
        if (extra) console.error(msg, extra); else console.error(msg);
        // Enviar a Sentry en producción
        if (process.env.NODE_ENV === 'production') {
            Sentry.captureException(new Error(msg), { extra });
        }
    },
    debug: (msg: string, extra?: Extra) => {
        if (process.env.NODE_ENV !== 'production') {
            if (extra) console.debug(msg, extra); else console.debug(msg);
        }
    },
};
