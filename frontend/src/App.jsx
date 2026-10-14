import './App.css'

// 상태 칸 3개 (SCREEN-SPEC.md S-01, 상태 값은 DATA-MODEL.md M-06)
const STATUSES = [
  { value: 'todo', label: '할 일' },
  { value: 'doing', label: '진행 중' },
  { value: 'done', label: '완료' },
]

function App() {
  return (
    <main className="app">
      <h1>할 일 카드</h1>
      <div className="columns">
        {STATUSES.map((status) => (
          <section key={status.value} className="column">
            <h2>{status.label}</h2>
          </section>
        ))}
      </div>
    </main>
  )
}

export default App
