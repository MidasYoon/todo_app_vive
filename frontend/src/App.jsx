import { useEffect, useState } from 'react'
import { fetchCards } from './api.js'
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
}

function App() {
  // 'loading' | 'loaded' | 'error'
  const [loadState, setLoadState] = useState('loading')
  const [cards, setCards] = useState([])
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let ignore = false
    fetchCards().then((result) => {
      if (ignore) return
      if (result.ok) {
        setCards(result.cards)
        setLoadState('loaded')
      } else {
        setLoadError(result.reason === 'storage' ? MESSAGES.loadStorage : MESSAGES.loadConnection)
        setLoadState('error')
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <main className="app">
      <h1>할 일 카드</h1>

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
              </section>
            ))}
          </div>
        </>
      )}

      {/* 오류 안내 자리 (SCREEN-SPEC.md "카드 화면" 4) */}
      {loadError && (
        <p className="error" role="alert">
          {loadError}
        </p>
      )}
    </main>
  )
}

export default App
