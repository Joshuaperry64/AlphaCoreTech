import { pushToServer } from './db_sync.js';

export function getLogs() {
  const data = localStorage.getItem('alphacore_system_logs');
  return data ? JSON.parse(data) : [];
}

export function logAction(action, details = {}, options = {}) {
  const logs = getLogs();
  const profile = options.profile || sessionStorage.getItem('current_profile') || 'UNAUTHENTICATED';
  const category = options.category || (action.includes('MEDIA') || action.includes('IMAGE') || action.includes('AUDIO') || action.includes('VIDEO') ? 'MEDIA' : (action.includes('AUTH') ? 'AUTH' : 'SYSTEM'));
  const level = options.level || (action.includes('ERROR') ? 'ERROR' : action.includes('WARN') ? 'WARN' : 'INFO');
  const message = options.message || (typeof details === 'string' ? details : (details.prompt ? details.prompt : (details.details || JSON.stringify(details))));

  logs.unshift({
    timestamp: Date.now(),
    profile,
    action,
    category,
    level,
    message,
    details
  });

  // Keep up to 500 logs for comprehensive site-wide auditing
  if (logs.length > 500) {
    logs.length = 500;
  }

  localStorage.setItem('alphacore_system_logs', JSON.stringify(logs));
  pushToServer('logs', logs);
}

export function clearLogs() {
  localStorage.setItem('alphacore_system_logs', '[]');
  pushToServer('logs', []);
}
