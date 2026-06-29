export function getLogs() {
  const data = localStorage.getItem('alphacore_system_logs');
  return data ? JSON.parse(data) : [];
}

export function logAction(action, details = {}) {
  const logs = getLogs();
  const profile = sessionStorage.getItem('current_profile') || 'UNAUTHENTICATED';
  
  logs.unshift({
    timestamp: Date.now(),
    profile,
    action,
    details
  });
  
  // Keep only the latest 200 logs to save space
  if (logs.length > 200) {
    logs.length = 200;
  }
  
  localStorage.setItem('alphacore_system_logs', JSON.stringify(logs));
}

export function clearLogs() {
  localStorage.removeItem('alphacore_system_logs');
}
