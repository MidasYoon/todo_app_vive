// 화면과 서버가 주고받는 요청 (API-SPEC.md)

// 서버가 돌려준 오류 모양 { errors: [{ field, kind }] }에서 kind 목록을 꺼냅니다.
// JSON이 아니거나 모양이 다르면 null (서버에 닿지 못한 것으로 봅니다).
async function readErrorKinds(response) {
  try {
    const body = await response.json()
    if (Array.isArray(body?.errors)) {
      return body.errors.map((error) => error.kind)
    }
  } catch {
    // JSON이 아님
  }
  return null
}

// 목록 보기: GET /api/cards
// 성공하면 { ok: true, cards }, 실패하면 { ok: false, reason: 'storage' | 'connection' }
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

  const kinds = await readErrorKinds(response)
  if (kinds?.includes('storage_error')) {
    return { ok: false, reason: 'storage' }
  }
  return { ok: false, reason: 'connection' }
}
