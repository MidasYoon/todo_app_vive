// 입력 규칙 (DATA-MODEL.md "입력 규칙")
// 서버 backend/app/rules.py와 같은 규칙입니다. 오류도 서버와 같은 모양 { field, kind }으로 돌려줍니다.

export const TITLE_MAX = 100 // M-04
export const DESCRIPTION_MAX = 1000 // M-04

// 글자 수는 코드 포인트 수로 셉니다 (M-13). .length는 이모지를 2자로 세므로 쓰지 않습니다.
export function countChars(text) {
  return [...text].length
}

// 만들기·고치기 입력을 검사합니다. 통과하면 errors가 빈 목록입니다.
export function checkCardInput(title, description) {
  const trimmedTitle = title.trim() // M-03
  const errors = []
  if (!trimmedTitle) {
    errors.push({ field: 'title', kind: 'title_empty' })
  } else if (countChars(trimmedTitle) > TITLE_MAX) {
    errors.push({ field: 'title', kind: 'too_long' })
  }
  if (countChars(description) > DESCRIPTION_MAX) {
    errors.push({ field: 'description', kind: 'too_long' })
  }
  return { title: trimmedTitle, description, errors }
}
