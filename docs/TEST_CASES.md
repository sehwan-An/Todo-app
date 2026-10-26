# TEST_CASES - Todo App (초안)

> 원본: docs/PRD.md, docs/TRD.md, docs/DATA_MODEL.md, docs/API_SPEC.md, docs/COMPONENT_SPEC.md
> 상태: 초안. COMPONENT_SPEC 6장의 "기본값"(완료 항목 제자리, 삭제 확인 창 없음)을 기준으로 썼다.

## 0. 공통 규칙
- 도구: Jest + React Testing Library
- 각 테스트는 **빈 데이터**에서 시작한다. 다른 테스트 결과에 영향을 받지 않는다.
- 문구는 API_SPEC.md / COMPONENT_SPEC.md에 적힌 문장과 **글자 하나까지 같아야** 통과로 본다.
- "100자 제목"처럼 길이를 말할 때는 PRD "제목 규칙"(코드 포인트 기준)으로 센다.
- 컴포넌트 테스트에서 화면 요소는 COMPONENT_SPEC 4-4의 접근성 이름으로 찾는다.

| 구분 | ID 접두어 | 도입 버전 |
|---|---|---|
| 제목 검증 규칙 (Zod) | V- | v0.1 |
| API | A- | v0.2 |
| 컴포넌트 | C- | v0.1 (C-APP-API는 v0.2) |
| 수동 확인 | M- | v0.3 |

---

## 1. 제목 검증 규칙 (src/lib의 Zod 스키마)

화면과 서버가 함께 쓰는 규칙이므로 따로 검사한다. (PRD "제목 규칙")

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| V-01 | 제목 스키마 | `"우유 사기"` | 통과. 값 `"우유 사기"` |
| V-02 | 제목 스키마 | `"  우유 사기  "` (앞뒤 공백) | 통과. 값 `"우유 사기"` (공백 제거) |
| V-03 | 제목 스키마 | `"우유  사기"` (가운데 공백 2개) | 통과. 가운데 공백은 그대로 `"우유  사기"` |
| V-04 | 제목 스키마 | `"가"` (1자, 최소) | 통과 |
| V-05 | 제목 스키마 | 한글 100자 (최대) | 통과 |
| V-06 | 제목 스키마 | 앞뒤 공백 + 한글 100자 | 통과 (공백 제거 후 100자) |
| V-07 | 제목 스키마 | `"👍"` 100개 | 통과 (100자로 셈) |
| V-08 | 제목 스키마 | `""` (빈 문자열) | 실패. 문구 "제목을 입력해 주세요." |
| V-09 | 제목 스키마 | `"   "` (공백만) | 실패. 문구 "제목을 입력해 주세요." |
| V-10 | 제목 스키마 | `"\n\t "` (줄바꿈, 탭, 공백만) | 실패. 문구 "제목을 입력해 주세요." |
| V-11 | 제목 스키마 | 한글 101자 | 실패. 문구 "제목은 100자 이하로 입력해 주세요." |
| V-12 | 제목 스키마 | `"👍"` 101개 | 실패. 문구 "제목은 100자 이하로 입력해 주세요." |

---

## 2. API

### 2-1. GET /api/todos (F-02)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| A-GET-01 | GET /api/todos | 할 일이 하나도 없음 | 200, 본문 `[]` |
| A-GET-02 | GET /api/todos | "A" → "B" → "C" 순서로 추가한 뒤 조회 | 200, 순서 `C, B, A` (최신순) |
| A-GET-03 | GET /api/todos | 할 일 하나 추가 후 조회 | 각 항목에 `id`, `title`, `completed`, `createdAt` 4개 필드만 있음 |
| A-GET-04 | GET /api/todos | 완료한 할 일과 미완료 할 일이 섞여 있음 | 완료 여부와 상관없이 만든 시간 순서로만 정렬됨 |
| A-GET-05 | GET /api/todos | `createdAt` 형식 확인 | ISO 형식 문자열 (예: `2026-10-23T00:00:00.000Z`) |
| A-GET-06 | GET /api/todos | 저장소(DB)에서 오류 발생 | 500, `INTERNAL_ERROR`, "서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." |

### 2-2. POST /api/todos (F-01)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| A-POST-01 | POST /api/todos | `{ "title": "우유 사기" }` | 201, `title` "우유 사기", `completed` false, `id`(uuid)와 `createdAt` 있음 |
| A-POST-02 | POST /api/todos | `{ "title": "  우유 사기  " }` | 201, `title` "우유 사기" (앞뒤 공백 제거) |
| A-POST-03 | POST /api/todos | 한글 100자 제목 | 201 |
| A-POST-04 | POST /api/todos | `"👍"` 100개 제목 | 201 |
| A-POST-05 | POST /api/todos | 추가 후 GET 조회 | 방금 추가한 할 일이 목록 맨 앞에 있음 |
| A-POST-06 | POST /api/todos | 같은 제목을 두 번 추가 | 둘 다 201, 서로 다른 `id` |
| A-POST-07 | POST /api/todos | 본문이 JSON이 아님 (`우유 사기`) | 400, `INVALID_JSON`, "요청 형식이 올바르지 않습니다." |
| A-POST-08 | POST /api/todos | `{}` (title 없음) | 400, `VALIDATION_ERROR`, "제목을 입력해 주세요." |
| A-POST-09 | POST /api/todos | `{ "title": 123 }` | 400, `VALIDATION_ERROR`, "제목은 문자열이어야 합니다." |
| A-POST-10 | POST /api/todos | `{ "title": "" }` | 400, `VALIDATION_ERROR`, "제목을 입력해 주세요." |
| A-POST-11 | POST /api/todos | `{ "title": "   " }` | 400, `VALIDATION_ERROR`, "제목을 입력해 주세요." |
| A-POST-12 | POST /api/todos | 한글 101자 제목 | 400, `VALIDATION_ERROR`, "제목은 100자 이하로 입력해 주세요." |
| A-POST-13 | POST /api/todos | `{ "title": "a", "completed": true }` | 400, `VALIDATION_ERROR`, "허용되지 않는 필드가 있습니다: completed" |
| A-POST-14 | POST /api/todos | 400 에러가 난 뒤 GET 조회 | 목록이 비어 있음 (아무것도 저장되지 않음) |
| A-POST-15 | POST /api/todos | 저장소(DB)에서 오류 발생 | 500, `INTERNAL_ERROR`, 메시지에 DB 오류 내용이 들어 있지 않음 |

### 2-3. PATCH /api/todos/{id} (F-03)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| A-PATCH-01 | PATCH /api/todos/{id} | 미완료 할 일에 `{ "completed": true }` | 200, `completed` true, 나머지 필드는 그대로 |
| A-PATCH-02 | PATCH /api/todos/{id} | 완료 할 일에 `{ "completed": false }` | 200, `completed` false |
| A-PATCH-03 | PATCH /api/todos/{id} | `{ "completed": true }`를 두 번 보냄 | 둘 다 200, `completed` true (결과 같음) |
| A-PATCH-04 | PATCH /api/todos/{id} | 성공 후 GET 조회 | 바뀐 값이 반영되어 있고 목록 순서는 그대로 |
| A-PATCH-05 | PATCH /api/todos/{id} | 본문이 JSON이 아님 (`{ completed: true`) | 400, `INVALID_JSON`, "요청 형식이 올바르지 않습니다." |
| A-PATCH-06 | PATCH /api/todos/{id} | `{}` (completed 없음) | 400, `VALIDATION_ERROR`, "completed 값이 필요합니다." |
| A-PATCH-07 | PATCH /api/todos/{id} | `{ "completed": "yes" }` | 400, `VALIDATION_ERROR`, "completed는 true 또는 false여야 합니다." |
| A-PATCH-08 | PATCH /api/todos/{id} | `{ "completed": true, "title": "새 제목" }` | 400, `VALIDATION_ERROR`, "허용되지 않는 필드가 있습니다: title". 제목은 바뀌지 않음 |
| A-PATCH-09 | PATCH /api/todos/{id} | 형식은 맞지만 없는 uuid | 404, `NOT_FOUND`, "할 일을 찾을 수 없습니다." |
| A-PATCH-10 | PATCH /api/todos/{id} | 형식이 틀린 id (`abc`) | 404, `NOT_FOUND`, "할 일을 찾을 수 없습니다." |
| A-PATCH-11 | PATCH /api/todos/{id} | 저장소(DB)에서 오류 발생 | 500, `INTERNAL_ERROR` |

### 2-4. DELETE /api/todos/{id} (F-04)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| A-DEL-01 | DELETE /api/todos/{id} | 있는 할 일 삭제 | 204, 본문 없음 |
| A-DEL-02 | DELETE /api/todos/{id} | 삭제 후 GET 조회 | 지운 할 일이 목록에 없음. 다른 할 일은 그대로 |
| A-DEL-03 | DELETE /api/todos/{id} | 같은 할 일을 두 번 삭제 | 첫 번째 204, 두 번째 404 `NOT_FOUND` |
| A-DEL-04 | DELETE /api/todos/{id} | 형식은 맞지만 없는 uuid | 404, `NOT_FOUND`, "할 일을 찾을 수 없습니다." |
| A-DEL-05 | DELETE /api/todos/{id} | 형식이 틀린 id (`abc`) | 404, `NOT_FOUND`, "할 일을 찾을 수 없습니다." |
| A-DEL-06 | DELETE /api/todos/{id} | 저장소(DB)에서 오류 발생 | 500, `INTERNAL_ERROR` |

### 2-5. 공통

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| A-COM-01 | 모든 에러 응답 | 위 400/404/500 케이스 전체 | 본문이 `{ "error": { "code", "message" } }` 형식이고 다른 필드 없음 |

---

## 3. 컴포넌트

컴포넌트 단독 테스트(C-FORM, C-LIST, C-ITEM, C-BANNER)는 props로 값과 가짜 함수를 넣어 검사한다.
TodoApp 테스트(C-APP)는 API 응답을 가짜로 바꿔(mock) 검사한다.

### 3-1. TodoForm (F-01)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| C-FORM-01 | TodoForm | 처음 화면 | 입력창(placeholder "할 일을 입력하세요")과 "추가" 버튼이 보임 |
| C-FORM-02 | TodoForm | "우유 사기" 입력 후 "추가" 클릭 | `onAdd("우유 사기")`가 1번 호출됨 |
| C-FORM-03 | TodoForm | "우유 사기" 입력 후 Enter | `onAdd("우유 사기")`가 1번 호출됨 |
| C-FORM-04 | TodoForm | "  우유 사기  " 입력 후 추가 | `onAdd("우유 사기")` (공백 제거된 값) |
| C-FORM-05 | TodoForm | `onAdd`가 성공(resolve) | 입력창이 비워지고 입력창에 커서(포커스)가 있음 |
| C-FORM-06 | TodoForm | `onAdd`가 끝나기 전 | 버튼 글자가 "추가 중..."이고 잠겨 있음. 다시 눌러도 `onAdd`가 더 호출되지 않음 |
| C-FORM-07 | TodoForm | 아무것도 입력하지 않고 추가 | "제목을 입력해 주세요." 표시, `onAdd` 호출 안 됨 |
| C-FORM-08 | TodoForm | 공백만 입력하고 추가 | "제목을 입력해 주세요." 표시, `onAdd` 호출 안 됨 |
| C-FORM-09 | TodoForm | 101자 입력하고 추가 | "제목은 100자 이하로 입력해 주세요." 표시, `onAdd` 호출 안 됨, 입력값 그대로 |
| C-FORM-10 | TodoForm | `"👍"` 100개 입력하고 추가 | 검증 문구 없이 `onAdd` 호출됨 (입력창이 글자를 자르지 않음) |
| C-FORM-11 | TodoForm | 검증 문구가 보이는 상태에서 다시 입력 | 검증 문구가 사라짐 |
| C-FORM-12 | TodoForm | `onAdd`가 실패(reject) | 입력값이 그대로 남아 있고 버튼이 다시 "추가"로 돌아옴 |

### 3-2. TodoList (F-02)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| C-LIST-01 | TodoList | `todos`가 빈 배열 | "아직 할 일이 없어요. 위에서 첫 할 일을 추가해 보세요." 표시 |
| C-LIST-02 | TodoList | 할 일 3개 | 3개 항목이 받은 순서 그대로 보임. 빈 목록 문구는 없음 |
| C-LIST-03 | TodoList | `busyIds`에 한 할 일의 id가 있음 | 그 항목만 잠기고 나머지는 사용 가능 |

### 3-3. TodoItem (F-03, F-04)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| C-ITEM-01 | TodoItem | 미완료 할 일 | 제목이 보이고, 체크박스 해제, 취소선 없음 |
| C-ITEM-02 | TodoItem | 완료 할 일 | 체크박스 체크, 제목에 취소선 |
| C-ITEM-03 | TodoItem | 미완료 할 일의 체크박스("{제목}" 완료) 클릭 | `onToggle(id, true)` 호출 |
| C-ITEM-04 | TodoItem | 완료 할 일의 체크박스 클릭 | `onToggle(id, false)` 호출 |
| C-ITEM-05 | TodoItem | "{제목}" 삭제 버튼 클릭 | 확인 창 없이 `onDelete(id)` 바로 호출 |
| C-ITEM-06 | TodoItem | `busy`가 true | 체크박스와 삭제 버튼이 잠겨 있고, 눌러도 함수가 호출되지 않음 |

### 3-4. ErrorBanner

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| C-BANNER-01 | ErrorBanner | `message`만 있음 | 메시지가 보이고 "다시 시도" 버튼은 없음 |
| C-BANNER-02 | ErrorBanner | `message`와 `onRetry`가 있음 | "다시 시도" 버튼이 보이고, 누르면 `onRetry` 1번 호출 |

### 3-5. TodoApp - v0.1 (API 없음)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| C-APP-01 | TodoApp | 처음 화면 | 빈 목록 문구가 보임. 로딩 문구는 없음 |
| C-APP-02 | TodoApp | "A" → "B" 순서로 추가 | 목록 순서 `B, A` |
| C-APP-03 | TodoApp | 할 일 체크 | 체크되고 취소선. 목록 순서는 그대로 |
| C-APP-04 | TodoApp | 하나뿐인 할 일 삭제 | 목록에서 사라지고 빈 목록 문구가 보임 |

### 3-6. TodoApp - v0.2 이후 (API 연결)

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| C-APP-API-01 | TodoApp | GET 응답 전 | "할 일을 불러오는 중..." 표시 |
| C-APP-API-02 | TodoApp | GET 성공, 할 일 2개 | 로딩 문구가 사라지고 2개 항목이 응답 순서대로 보임 |
| C-APP-API-03 | TodoApp | GET 성공, `[]` | 빈 목록 문구 표시 |
| C-APP-API-04 | TodoApp | GET 실패 (500) | "할 일을 불러오지 못했습니다."와 "다시 시도" 버튼 표시 |
| C-APP-API-05 | TodoApp | GET 실패 후 "다시 시도" 클릭, 이번엔 성공 | 로딩 문구가 잠깐 보인 뒤 목록 표시 |
| C-APP-API-06 | TodoApp | 추가 → POST 성공 (201) | 응답받은 할 일이 목록 맨 위에 보이고 입력창이 비워짐 |
| C-APP-API-07 | TodoApp | 추가 → POST 실패 (400, 서버 메시지) | ErrorBanner에 응답의 `error.message`가 그대로 보이고 입력값은 남아 있음 |
| C-APP-API-08 | TodoApp | 추가 → POST 실패 (500) | ErrorBanner에 "서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." |
| C-APP-API-09 | TodoApp | 추가 → 네트워크 오류 (연결 실패) | ErrorBanner에 "서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요." |
| C-APP-API-10 | TodoApp | 요청 → 에러 형식이 아닌 응답 (405) | ErrorBanner에 "알 수 없는 오류가 발생했습니다." |
| C-APP-API-11 | TodoApp | 체크 → 응답 전 | 그 항목의 체크박스와 삭제 버튼이 잠겨 있음 |
| C-APP-API-12 | TodoApp | 체크 → PATCH 성공 | 응답 값대로 체크되고 잠금이 풀림. 목록 순서 그대로 |
| C-APP-API-13 | TodoApp | 체크 → PATCH 실패 (404) | 체크박스가 원래 상태로 남고 ErrorBanner에 "할 일을 찾을 수 없습니다.", 잠금이 풀림 |
| C-APP-API-14 | TodoApp | 삭제 → DELETE 성공 (204) | 그 항목이 목록에서 사라짐 |
| C-APP-API-15 | TodoApp | 삭제 → DELETE 실패 (500) | 항목이 그대로 남고 ErrorBanner에 에러 문구, 잠금이 풀림 |
| C-APP-API-16 | TodoApp | ErrorBanner가 보이는 상태에서 다음 작업 시작 | 이전 에러 메시지가 사라짐 |

---

## 4. 수동 확인 (v0.3 이후)

자동 테스트로 확인하기 어려운 F-05(데이터 유지)는 직접 확인한다.

| ID | 대상 | 상황 | 기대 결과 |
|---|---|---|---|
| M-01 | 앱 전체 | 할 일 추가 후 브라우저 새로고침 | 할 일이 그대로 남아 있음 |
| M-02 | 앱 전체 | 할 일 추가 후 서버를 껐다 다시 켜고 새로고침 | 할 일이 그대로 남아 있음 |
| M-03 | 앱 전체 | 완료 체크 / 삭제 후 새로고침 | 바뀐 상태가 그대로 유지됨 |
| M-04 | 배포된 앱 (v1.0) | 배포 URL에서 추가, 체크, 삭제, 새로고침 | 모두 로컬과 같게 동작 |

---

## 5. PRD 성공 기준과의 연결

| PRD 성공 기준 | 테스트 |
|---|---|
| 1~100자 제목은 추가, 빈/공백만/101자 이상은 거부 | V-01 ~ V-12, A-POST-01 ~ 12, C-FORM-07 ~ 10 |
| 앞뒤 공백은 지워진 채로 저장 | V-02, A-POST-02, C-FORM-04 |
| 목록이 최신순으로 표시 | A-GET-02, A-POST-05, C-APP-02, C-APP-API-06 |
| 체크박스로 완료 ↔ 미완료 양방향 전환 | A-PATCH-01 ~ 02, C-ITEM-03 ~ 04, C-APP-API-12 |
| 삭제한 할 일은 목록에서 사라짐 | A-DEL-01 ~ 02, C-APP-04, C-APP-API-14 |
| 새로고침/서버 재시작 후에도 데이터 유지 | M-01 ~ M-03 |
| 배포 URL에서 MVP 기능 사용 가능 | M-04 |
