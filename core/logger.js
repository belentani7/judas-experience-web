// Structured JSON logging for Three.js experience
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  _log(level, event, data = {}) {
    if (this.levels[level] >= this.levels[this.level]) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        data,
        sessionId: this.sessionId || 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      };
      console.log(JSON.stringify(entry));
    }
  }

  debug(event, data) { this._log('debug', event, data); }
  info(event, data) { this._log('info', event, data); }
  warn(event, data) { this._log('warn', event, data); }
  error(event, data) { this._log('error', event, data); }

  setSessionId(id) { this.sessionId = id; }
}

export const logger = new Logger();

// Log key events in the experience
export function logExperienceEvent(event, data = {}) {
  logger.info(event, data);
}

export function logPerformanceMetric(metric, value, unit = 'ms') {
  logger.info('performance_metric', { metric, value, unit });
}

export function logError(error, context = {}) {
  logger.error('experience_error', { 
    message: error.message, 
    stack: error.stack, 
    ...context 
  });
}

export function logUserInteraction(action, target, metadata = {}) {
  logger.info('user_interaction', { action, target, ...metadata });
}

export function logSceneTransition(from, to) {
  logger.info('scene_transition', { from, to });
}

export function logAssetLoad(asset, duration, success) {
  logger.info('asset_load', { asset, duration, success });
}

export function logShaderCompile(shader, duration, success) {
  logger.info('shader_compile', { shader, duration, success });
}