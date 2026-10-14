// 화면과 서버가 주고받는 요청 (API-SPEC.md)

// 서버가 돌려준 오류 모양 { errors: [{ field, kind }] }에서 오류 목록을 꺼냅니다.
// JSON이 아니거나 모양이 다르면 null (서버에 닿지 못한 것으로 봅니다).
async function readErrors(response) {
  try {
    const body = await response.json()
    if (Array.isArray(body?.errors)) {
      return body.errors
    }
  } catch {
    // JSON이 아님
  }
  return null
}

// 실패한 응답을 { ok: false, reason, errors }로 바꿉니다.
// reason: 'invalid'(입력 오류) | 'not_found'(없는 카드) | 'storage'(저장소 오류) | 'connection'(서버에 닿지 못함)
async function failure(response) {
  const errors = await readErrors(response)
  if (!errors) {
    return { ok: false, reason: 'connection' }
  }
  if (errors.some((error) => error.kind === 'storage_error')) {
    return { ok: false, reason: 'storage' }
  }
  if (response.status === 404 && errors.some((error) => error.kind === 'not_found')) {
    return { ok: false, reason: 'not_found' }
  }
  if (response.status === 422) {
    return { ok: false, reason: 'invalid', errors }
  }
  return { ok: false, reason: 'connection' }
}

// 목록 보기: GET /api/cards
// 성공하면 { ok: true, cards }
export async function fetchCards() {
  let response
  try {
    response = await fetch('/api/cards')
  } catch {
    return { ok: false, reason: 'connection' }
  }

  if (response.ok) {
    try {
      return { ok: true, cards: await response.json() }
    } catch {
      return { ok: false, reason: 'connection' }
    }
  }
  return failure(response)
}

// 카드 만들기: POST /api/cards
// 성공하면 { ok: true, card }
export async function createCard(title, description) {
  let response
  try {
    response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
  } catch {
    return { ok: false, reason: 'connection' }
  }

  if (response.status === 201) {
    try {
      return { ok: true, card: await response.json() }
    } catch {
      return { ok: false, reason: 'connection' }
    }
  }
  return failure(response)
}

// 상태 바꾸기, 고치기: PATCH /api/cards/{id}. 바꿀 칸만 보냅니다 (A-01).
// 성공하면 { ok: true, card }
export async function updateCard(id, fields) {
  let response
  try {
    response = await fetch(`/api/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
  } catch {
    return { ok: false, reason: 'connection' }
  }

  if (response.status === 200) {
    try {
      return { ok: true, card: await response.json() }
    } catch {
      return { ok: false, reason: 'connection' }
    }
  }
  return failure(response)
}
