const KEYS = {
  settings: 'numbly_settings',
  progress: 'numbly_progress',
  sessions: 'numbly_sessions',
  level: 'numbly_level',
}

const defaults = {
  settings: { operations: ['add', 'sub'], min: 1, max: 10, duration: 60 },
  progress: { totalSessions: 0, totalTasks: 0, totalCorrect: 0 },
  sessions: [],
  level: 1,
}

function get(key) {
  try {
    const val = localStorage.getItem(KEYS[key])
    return val ? JSON.parse(val) : defaults[key]
  } catch {
    return defaults[key]
  }
}

function set(key, value) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value))
  } catch {
    console.warn('Storage full')
  }
}

export const storage = { get, set }