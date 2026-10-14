# 할 일 카드

할 일을 카드로 만들고, 카드의 상태를 할 일 / 진행 중 / 완료 중 하나로 바꾸는 웹앱입니다.

## 현재 상태

만드는 중입니다. 화면(`frontend/`)과 서버(`backend/`)가 있습니다. 화면을 열면 서버에서 카드 목록을 받아 와 상태 칸 3개(할 일 / 진행 중 / 완료)에 보여 줍니다. 제목과 설명을 적어 카드를 만들 수 있고, 새 카드는 "할 일" 칸 맨 위에 생깁니다. 카드의 상태 버튼으로 할 일 / 진행 중 / 완료 어느 상태로든 바꿀 수 있습니다. 카드 자리에서 제목과 설명을 고칠 수 있고, "정말 지울까요?"를 확인한 뒤 카드를 지울 수 있습니다. 서버가 꺼져 있거나 저장소에 문제가 있거나 이미 지워진 카드를 다루면 안내 문구를 보여 줍니다. 남은 일은 전체 시험(P-20)입니다.

- 문서: README.md, AGENTS.md, DECISIONS.md, PLAN.md, PRD.md, ARCHITECTURE.md, SCREEN-SPEC.md, DATA-MODEL.md, API-SPEC.md, TEST-PLAN.md
- 진행 상황: PLAN.md "작업 목록"에 적었습니다.

- 만들 기능과 넣지 않는 기능: PRD.md에 적었습니다.

## 프로젝트 문서

| 파일 | 내용 |
| --- | --- |
| README.md | 프로젝트 소개, 현재 상태, 시작 방법과 실행 방법 (지금 보고 있는 파일) |
| AGENTS.md | AI가 이 프로젝트에서 일할 때 지키는 작업 규칙 |
| DECISIONS.md | 사람이 확정한 결정 기록 |
| PLAN.md | 이번 작업의 목표, 작업 목록, 검증 결과, 남은 문제 |
| PRD.md | 첫 버전에서 만들 기능, 넣지 않는 기능, 요구사항 후보와 검토 |
| ARCHITECTURE.md | 앱을 이루는 부분(화면·서버·저장소)과 각 부분의 책임 |
| SCREEN-SPEC.md | 화면에서 보이는 것과 사용자가 할 수 있는 행동 |
| DATA-MODEL.md | 저장할 정보(카드 항목, 상태 값, 입력 규칙)의 이름과 뜻 |
| API-SPEC.md | 화면과 서버가 주고받는 요청과 응답, 오류 응답 |
| TEST-PLAN.md | 기능마다 시험하는 방법과 기대 결과 |

## 시작 방법

1. 이 README.md를 먼저 읽습니다.
2. "현재 상태"에서 지금 어디까지 만들어졌는지 확인합니다.
3. "프로젝트 문서"에 적힌 파일을 차례로 읽습니다.

## 실행 방법

(D-005)

필요한 것: Python 3.12, Node.js 22 (LTS)

처음 한 번만 설치합니다.

- 화면: `frontend` 폴더에서 `npm install`
- 서버: `backend` 폴더에서 `python -m venv .venv`로 가상 환경을 만든 뒤, `.venv\Scripts\python -m pip install -r requirements.txt`

서버와 화면을 터미널 두 개에서 따로 켭니다.

1. 서버: `backend` 폴더에서 `.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000`. 가상 환경의 Python으로 D-005의 서버 명령을 실행하는 것이라, 가상 환경을 따로 켤(`Activate.ps1`) 필요가 없습니다. 처음 켜면 카드 저장 파일 `backend/data/cards.db`가 생깁니다.
2. 화면: `frontend` 폴더에서 `npm run dev`
3. 브라우저에서 http://localhost:5173 을 엽니다.

## 확인과 기록

- 기능을 추가하거나 바꾸면 실제로 동작하는지 직접 확인합니다.
- 확인한 뒤 "현재 상태"를 지금 상황에 맞게 고칩니다.
- 새 문서를 만들면 "프로젝트 문서" 표에 추가합니다.
