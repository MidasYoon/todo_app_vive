import { useEffect, useState } from 'react'
import { createCard, fetchCards } from './api.js'
import { checkCardInput } from './rules.js'
import './App.css'

// 상태 칸 3개 (SCREEN-SPEC.md S-01, 상태 값은 DATA-MODEL.md M-06)
const STATUSES = [
  { value: 'todo', label: '할 일' },
  { value: 'doing', label: '진행 중' },
  { value: 'done', label: '완료' },
]

// 안내 문구 (SCREEN-SPEC.md "안내 문구")
const MESSAGES = {
  loading: '카드를 불러오는 중입니다.', // S-14
  empty: '아직 카드가 없습니다. 위에서 카드를 만들어 보세요.', // S-04
  loadConnection: '카드를 불러오지 못했습니다. 서버가 켜져 있는지 확인해 주세요.', // S-18
  loadStorage: '카드를 불러오지 못했습니다. 잠시 후 새로 고쳐 주세요.', // S-18
  saveConnection: '저장하지 못했습니다. 서버가 켜져 있는지 확인해 주세요.', // S-10
  saveStorage: '저장하지 못했습니다. 잠시 후 다시 해 주세요.', // S-12
  titleEmpty: '제목을 적어 주세요.', // S-03
  tooLong: '제목은 100자, 설명은 1000자까지 적을 수 있습니다.', // S-19
}

// 입력 오류 { field, kind } 목록을 안내 문구 목록으로 바꿉니다 (S-20, S-21).
// 같은 문구는 한 번만 보여 줍니다. invalid_value는 화면 문구가 없습니다 (A-08).
function inputMessages(errors) {
  const messages = []
  for (const error of errors) {
    const message =
      error.kind === 'title_empty'
        ? MESSAGES.titleEmpty
        : error.kind === 'too_long'
          ? MESSAGES.tooLong
          : null
    if (message && !messages.includes(message)) {
      messages.push(message)
    }
  }
  return messages
}

function saveFailureMessage(reason) {
  return reason === 'storage' ? MESSAGES.saveStorage : MESSAGES.saveConnection
}

// 카드 만들기 영역 (SCREEN-SPEC.md S-08)
function CreateCardForm({ onCreated, onSaveFailed }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const input = checkCardInput(title, description)
    if (input.errors.length > 0) {
      setMessages(inputMessages(input.errors))
      return
    }

    setMessages([])
    setSending(true) // S-22
    const result = await createCard(input.title, input.description)
    setSending(false)

    if (result.ok) {
      setTitle('')
      setDescription('')
      onCreated(result.card)
    } else if (result.reason === 'invalid') {
      setMessages(inputMessages(result.errors)) // S-20
    } else {
      onSaveFailed(saveFailureMessage(result.reason)) // 입력칸은 그대로 남깁니다 (S-16)
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit} noValidate>
      <label>
        제목
        <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        설명
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <button type="submit" disabled={sending}>
        만들기
      </button>
      {messages.map((message) => (
        <p key={message} className="input-message" role="alert">
          {message}
        </p>
      ))}
    </form>
  )
}

// 카드 하나 (SCREEN-SPEC.md "카드 하나"). 상태 버튼·고치기·지우기는 P-16, P-17에서 붙입니다.
function Card({ card }) {
  return (
    <article className="card">
      <h3>{card.title}</h3>
      {card.description && <p className="card-description">{card.description}</p>}
    </article>
  )
}

function App() {
  // 'loading' | 'loaded' | 'error'
  const [loadState, setLoadState] = useState('loading')
  const [cards, setCards] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    let ignore = false
    fetchCards().then((result) => {
      if (ignore) return
      if (result.ok) {
        setCards(result.cards)
        setLoadState('loaded')
      } else {
        setErrorMessage(result.reason === 'storage' ? MESSAGES.loadStorage : MESSAGES.loadConnection)
        setLoadState('error')
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  function handleCreated(card) {
    // 새 카드는 가장 최근 카드이므로 맨 앞에 넣으면 A-05 순서와 같습니다.
    setCards((current) => [card, ...current])
    // 저장 실패 안내만 지웁니다. 목록을 불러오지 못했다는 안내는 남깁니다.
    setErrorMessage((current) =>
      current === MESSAGES.saveConnection || current === MESSAGES.saveStorage ? null : current,
    )
  }

  return (
    <main className="app">
      <h1>할 일 카드</h1>

      <CreateCardForm onCreated={handleCreated} onSaveFailed={setErrorMessage} />

      {loadState === 'loading' ? (
        <p className="notice">{MESSAGES.loading}</p>
      ) : (
        <>
          {loadState === 'loaded' && cards.length === 0 && (
            <p className="notice">{MESSAGES.empty}</p>
          )}
          <div className="columns">
            {STATUSES.map((status) => (
              <section key={status.value} className="column">
                <h2>{status.label}</h2>
                {cards
                  .filter((card) => card.status === status.value)
                  .map((card) => (
                    <Card key={card.id} card={card} />
                  ))}
              </section>
            ))}
          </div>
        </>
      )}

      {/* 오류 안내 자리 (SCREEN-SPEC.md "카드 화면" 4) */}
      {errorMessage && (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      )}
    </main>
  )
}

export default App
