import { useEffect, useRef, useState } from 'react'
import { createCard, deleteCard, fetchCards, updateCard } from './api.js'
import { checkCardInput } from './rules.js'
import { applyTheme, initialTheme, saveTheme } from './theme.js'
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
  invalidStatus: '상태를 바꾸지 못했습니다. 새로 고친 뒤 다시 해 주세요.', // S-19
  notFound: '이미 지워진 카드입니다. 목록을 다시 불러왔습니다.', // S-13, S-17
}

// 저장(만들기·상태 바꾸기·고치기·지우기)에 실패했을 때 오류 안내 자리에 보이는 문구들.
// 다음 저장이 성공하면 지웁니다. 목록을 불러오지 못했다는 안내는 남깁니다.
const SAVE_FAILURE_MESSAGES = [
  MESSAGES.saveConnection,
  MESSAGES.saveStorage,
  MESSAGES.invalidStatus,
  MESSAGES.notFound,
]

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
      <div className="create-foot">
        <div className="input-messages">
          {messages.map((message) => (
            <p key={message} className="input-message" role="alert">
              {message}
            </p>
          ))}
        </div>
        <button type="submit" className="btn-primary" disabled={sending}>
          만들기
        </button>
      </div>
    </form>
  )
}

// 카드를 고치는 중 (SCREEN-SPEC.md "카드를 고치는 중"). 카드 자리에서 바로 고칩니다 (S-09).
// onSave는 서버 결과를 돌려줍니다. 입력 오류만 여기서 보여 주고, 그 밖의 실패는 App이 안내합니다.
function EditCardForm({ card, onSave, onClose }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [messages, setMessages] = useState([])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const input = checkCardInput(title, description)
    if (input.errors.length > 0) {
      setMessages(inputMessages(input.errors))
      return
    }

    // 바뀐 칸만 보냅니다 (A-01). 바뀐 것이 없으면 보내지 않고 닫습니다 (S-24).
    const fields = {}
    if (input.title !== card.title) fields.title = input.title
    if (input.description !== card.description) fields.description = input.description
    if (Object.keys(fields).length === 0) {
      onClose()
      return
    }

    setMessages([])
    setSaving(true) // S-22
    const result = await onSave(card, fields)
    setSaving(false)

    if (result.ok) {
      onClose()
    } else if (result.reason === 'invalid') {
      setMessages(inputMessages(result.errors)) // S-20
    }
    // 그 밖의 실패는 고치는 중인 채로 남습니다 (SCREEN-SPEC.md "카드 고치기" 6).
  }

  return (
    <form className="card edit-form" onSubmit={handleSubmit} noValidate>
      <label>
        제목
        <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        설명
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {messages.map((message) => (
        <p key={message} className="input-message" role="alert">
          {message}
        </p>
      ))}
      <div className="edit-buttons">
        {/* 고친 내용을 버리고 원래 카드로 돌아갑니다 (S-06) */}
        <button type="button" className="btn" disabled={saving} onClick={onClose}>
          취소
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          저장
        </button>
      </div>
    </form>
  )
}

// 카드 하나 (SCREEN-SPEC.md "카드 하나"). 카드마다 따로 고치는 중이 될 수 있습니다 (S-23).
function Card({ card, busy, onChangeStatus, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return <EditCardForm card={card} onSave={onSave} onClose={() => setEditing(false)} />
  }

  return (
    <article className="card">
      <h3>{card.title}</h3>
      {card.description && <p className="card-description">{card.description}</p>}
      <div className="card-buttons">
        <div className="button-group">
          {/* 상태 버튼 3개. 지금 상태 버튼과 보내는 동안의 버튼은 누를 수 없습니다 (S-02, S-22).
              지금 상태 버튼은 회색으로 채우고, 보내는 동안에는 흐리게 보입니다 (DS-09, DS-10). */}
          {STATUSES.map((status) => {
            const current = card.status === status.value
            return (
              <button
                key={status.value}
                type="button"
                className={current ? 'btn btn-current' : 'btn'}
                data-busy={busy || undefined}
                disabled={busy || current}
                onClick={() => onChangeStatus(card, status.value)}
              >
                {status.label}
              </button>
            )
          })}
        </div>
        <div className="button-group">
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            고치기
          </button>
          <button type="button" className="btn-danger" onClick={() => onDelete(card)}>
            지우기
          </button>
        </div>
      </div>
    </article>
  )
}

// 지우기 확인 창 (SCREEN-SPEC.md "지우기 확인 창"). 브라우저 기본 확인 창이 아닌 앱 안 창입니다 (S-15).
function DeleteDialog({ deleting, onYes, onNo }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  function handleCancel(event) {
    // Esc는 [아니요]와 같습니다 (S-25). 지우는 동안에는 닫지 않습니다 (S-22).
    event.preventDefault()
    if (!deleting) onNo()
  }

  return (
    <dialog ref={dialogRef} className="delete-dialog" onCancel={handleCancel}>
      <p>정말 지울까요?</p>
      <div className="dialog-buttons">
        <button type="button" className="btn" disabled={deleting} onClick={onNo}>
          아니요
        </button>
        <button type="button" className="btn-danger-fill" disabled={deleting} onClick={onYes}>
          예
        </button>
      </div>
    </dialog>
  )
}

// 화면 모드 스위치 (SCREEN-SPEC.md S-28). 서버에는 아무것도 보내지 않습니다.
function ThemeSwitch() {
  const [theme, setTheme] = useState(initialTheme)

  function handleClick() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    saveTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="theme-switch"
      role="switch"
      aria-checked={theme === 'dark'}
      onClick={handleClick}
    >
      어두운 화면
      <span className="switch-track" aria-hidden="true" />
    </button>
  )
}

function loadFailureMessage(reason) {
  return reason === 'storage' ? MESSAGES.loadStorage : MESSAGES.loadConnection
}

function App() {
  // 'loading' | 'loaded' | 'error'
  const [loadState, setLoadState] = useState('loading')
  const [cards, setCards] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  // 서버에 상태 바꾸기를 보내는 중인 카드 번호들 (S-22)
  const [busyIds, setBusyIds] = useState([])
  // 지우기 확인 창을 띄운 카드, 지우는 중인지 (S-22)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let ignore = false
    fetchCards().then((result) => {
      if (ignore) return
      if (result.ok) {
        setCards(result.cards)
        setLoadState('loaded')
      } else {
        setErrorMessage(loadFailureMessage(result.reason))
        setLoadState('error')
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  function clearSaveFailure() {
    setErrorMessage((current) => (SAVE_FAILURE_MESSAGES.includes(current) ? null : current))
  }

  function handleCreated(card) {
    // 새 카드는 가장 최근 카드이므로 맨 앞에 넣으면 A-05 순서와 같습니다.
    setCards((current) => [card, ...current])
    clearSaveFailure()
  }

  // 없는 카드였을 때: S-13 문구를 보여 주고 목록을 다시 받아 옵니다 (S-17).
  async function reloadAfterNotFound() {
    const result = await fetchCards()
    if (result.ok) {
      setCards(result.cards)
      setLoadState('loaded')
      setErrorMessage(MESSAGES.notFound)
    } else {
      setErrorMessage(loadFailureMessage(result.reason))
    }
  }

  async function handleChangeStatus(card, status) {
    setBusyIds((current) => [...current, card.id])
    const result = await updateCard(card.id, { status })
    setBusyIds((current) => current.filter((id) => id !== card.id))

    if (result.ok) {
      // 목록 안의 자리는 그대로 두고 카드만 바꿉니다. 칸마다 걸러 보여 주므로
      // 새 칸에서도 만든 시각 순서를 따릅니다 (R-012).
      setCards((current) => current.map((item) => (item.id === card.id ? result.card : item)))
      clearSaveFailure()
    } else if (result.reason === 'not_found') {
      await reloadAfterNotFound()
    } else if (result.reason === 'invalid') {
      setErrorMessage(MESSAGES.invalidStatus) // S-19
    } else {
      setErrorMessage(saveFailureMessage(result.reason)) // 카드는 원래 칸에 남습니다
    }
  }

  // 고친 내용 저장. 결과를 EditCardForm에 돌려줍니다.
  async function handleSave(card, fields) {
    const result = await updateCard(card.id, fields)
    if (result.ok) {
      setCards((current) => current.map((item) => (item.id === card.id ? result.card : item)))
      clearSaveFailure()
    } else if (result.reason === 'not_found') {
      await reloadAfterNotFound()
    } else if (result.reason !== 'invalid') {
      setErrorMessage(saveFailureMessage(result.reason))
    }
    return result
  }

  async function handleDeleteYes() {
    const card = deleteTarget
    setDeleting(true) // S-22
    const result = await deleteCard(card.id)
    setDeleting(false)
    setDeleteTarget(null) // 성공해도 실패해도 창을 닫습니다 (S-26)

    if (result.ok) {
      setCards((current) => current.filter((item) => item.id !== card.id))
      clearSaveFailure()
    } else if (result.reason === 'not_found') {
      await reloadAfterNotFound()
    } else {
      setErrorMessage(saveFailureMessage(result.reason)) // 카드는 그대로 남습니다
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>할 일 카드</h1>
        <ThemeSwitch />
      </header>

      <CreateCardForm onCreated={handleCreated} onSaveFailed={setErrorMessage} />

      {/* 오류 안내 자리 (SCREEN-SPEC.md "카드 화면" 3). 상태 칸 위에 둡니다 (DESIGN.md "배치"). */}
      {errorMessage && (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      )}

      {loadState === 'loading' ? (
        <p className="notice">{MESSAGES.loading}</p>
      ) : (
        <>
          {loadState === 'loaded' && cards.length === 0 && (
            <p className="notice">{MESSAGES.empty}</p>
          )}
          <div className="columns">
            {STATUSES.map((status) => {
              const columnCards = cards.filter((card) => card.status === status.value)
              return (
                <section key={status.value} className={`column column-${status.value}`}>
                  <div className="column-head">
                    <span className="status-dot" aria-hidden="true" />
                    <h2>{status.label}</h2>
                    {/* 칸 머리 카드 수. 목록을 불러오지 못했을 때는 보여 주지 않습니다 (S-27). */}
                    {loadState === 'loaded' && (
                      <span className="column-count">{columnCards.length}</span>
                    )}
                  </div>
                  <div className="card-list">
                    {columnCards.map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        busy={busyIds.includes(card.id)}
                        onChangeStatus={handleChangeStatus}
                        onSave={handleSave}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}

      {deleteTarget && (
        <DeleteDialog
          deleting={deleting}
          onYes={handleDeleteYes}
          onNo={() => setDeleteTarget(null)} // 서버에 보내지 않습니다 (S-07)
        />
      )}
    </main>
  )
}

export default App
