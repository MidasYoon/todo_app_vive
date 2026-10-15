// 화면 모드 (밝은 화면 / 어두운 화면). DESIGN.md DS-13, SCREEN-SPEC.md S-28, DECISIONS.md D-008.
// 브라우저에는 이 설정 하나만 기억합니다. 카드는 브라우저에 저장하지 않습니다 (ARCHITECTURE.md).

const STORAGE_KEY = 'todo-card-theme'

function savedTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null // 기억하지 못하는 브라우저에서는 처음 모드로 엽니다
  }
}

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 처음 열 때: 기억한 모드가 있으면 그 모드, 없으면 컴퓨터 설정을 따릅니다.
export function initialTheme() {
  return savedTheme() ?? systemTheme()
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // 기억하지 못해도 지금 화면의 모드는 바뀝니다
  }
}

// 첫 화면을 그리기 전에 모드를 붙여 화면이 깜빡이지 않게 합니다.
applyTheme(initialTheme())
