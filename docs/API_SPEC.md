# API_SPEC - Todo App (초안)

> 원본: docs/DATA_MODEL.md, docs/PRD.md
> 상태: 초안

## 1. 공통 규칙
- **도입 버전**: v0.2부터 사용한다. (v0.1은 화면만 있고 API가 없다)
- **주소**: 화면과 같은 서버의 `/api/...` (예: `http://localhost:3000/api/todos`)
- **인증**: 없음 (로그인은 범위 밖)
- **형식**: 요청과 응답 본문은 JSON. 요청 시 `Content-Type: application/json` 헤더를 보낸다.
- **할 일 모양**: 응답의 할 일은 DATA_MODEL.md의 `Todo` 타입을 따른다.
- **알 수 없는 필드**: 요청 본문에 정해지지 않은 필드가 있으면 거부한다. (예: PATCH에 `title`을 보내면 400)

## 2. 엔드포인트 목록

| 메서드 | 주소 | 설명 | 기능 | 성공 코드 |
|---|---|---|---|---|
| GET | /api/todos | 할 일 목록 조회 | F-02 | 200 |
| POST | /api/todos | 할 일 추가 | F-01 | 201 |
| PATCH | /api/todos/{id} | 완료 상태 전환 | F-03 | 200 |
| DELETE | /api/todos/{id} | 할 일 삭제 | F-04 | 204 |

- F-05(데이터 유지)는 별도 API가 아니라 서버 저장 방식(v0.3 DB)으로 충족한다.

## 3. 에러 형식
모든 에러 응답은 아래 형식으로 통일한다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "제목을 입력해 주세요."
  }
}
```

- `code`: 프로그램이 구분하는 값 (영문 대문자, 바뀌지 않음)
- `message`: 사람이 읽는 설명 (한국어, 화면에 그대로 보여줘도 됨)

### 에러 코드 목록

| code | 상태 코드 | 언제 |
|---|---|---|
| INVALID_JSON | 400 | 요청 본문이 올바른 JSON이 아닐 때 |
| VALIDATION_ERROR | 400 | 필드가 없거나, 타입이 틀리거나, 규칙(제목 1~100자 등)을 어겼거나, 알 수 없는 필드가 있을 때 |
| NOT_FOUND | 404 | 해당 id의 할 일이 없을 때 (id 형식이 uuid가 아닐 때도 포함) |
| INTERNAL_ERROR | 500 | 서버나 DB에서 예상하지 못한 오류가 났을 때 |

- INTERNAL_ERROR의 message에는 DB 오류 내용 같은 내부 정보를 넣지 않는다.

---

## 4. GET /api/todos — 목록 조회 (F-02)

전체 할 일을 `createdAt` 최신순(가장 최근이 맨 앞)으로 돌려준다.

**요청**
- 본문 없음

**응답 200**
```json
[
  {
    "id": "3f2a8c1e-5b7d-4e9a-a1c2-0d4e6f8b9a01",
    "title": "우유 사기",
    "completed": false,
    "createdAt": "2026-10-23T00:00:00.000Z"
  },
  {
    "id": "9b7c2d4e-1f3a-4b5c-8d6e-7f8a9b0c1d4d",
    "title": "PRD 쓰기",
    "completed": true,
    "createdAt": "2026-10-22T09:30:00.000Z"
  }
]
```

**할 일이 없을 때 200**
```json
[]
```

- 완료 여부와 상관없이 만든 시간 순서로만 정렬한다. 완료 항목을 아래로 내리는 등의 표시는 화면이 정한다.
- 페이지 나누기는 하지 않는다. (혼자 쓰는 앱이라 데이터가 적음)

**에러**

| 상황 | 상태 코드 | code | message |
|---|---|---|---|
| 서버/DB 오류 | 500 | INTERNAL_ERROR | 서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요. |

---

## 5. POST /api/todos — 할 일 추가 (F-01)

**요청**
```json
{
  "title": "  우유 사기  "
}
```

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| title | string | O | PRD "제목 규칙": 앞뒤 공백 제거 후 1~100자 (코드 포인트 기준) |

- `id`, `completed`, `createdAt`은 보내지 않는다. 서버/DB가 채운다.

**응답 201** (앞뒤 공백이 지워진 채 저장됨)
```json
{
  "id": "3f2a8c1e-5b7d-4e9a-a1c2-0d4e6f8b9a01",
  "title": "우유 사기",
  "completed": false,
  "createdAt": "2026-10-23T00:00:00.000Z"
}
```

**에러**

| 상황 | 요청 예시 | 상태 코드 | code | message |
|---|---|---|---|---|
| JSON이 아님 | `우유 사기` | 400 | INVALID_JSON | 요청 형식이 올바르지 않습니다. |
| title 없음 | `{}` | 400 | VALIDATION_ERROR | 제목을 입력해 주세요. |
| title이 문자열이 아님 | `{ "title": 123 }` | 400 | VALIDATION_ERROR | 제목은 문자열이어야 합니다. |
| 빈 제목 / 공백만 | `{ "title": "   " }` | 400 | VALIDATION_ERROR | 제목을 입력해 주세요. |
| 100자 초과 | `{ "title": "가가...(101자)" }` | 400 | VALIDATION_ERROR | 제목은 100자 이하로 입력해 주세요. |
| 알 수 없는 필드 | `{ "title": "a", "completed": true }` | 400 | VALIDATION_ERROR | 허용되지 않는 필드가 있습니다: completed |
| 서버/DB 오류 | - | 500 | INTERNAL_ERROR | 서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요. |

에러 응답 예시 (공백만 입력):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "제목을 입력해 주세요."
  }
}
```

---

## 6. PATCH /api/todos/{id} — 완료 상태 전환 (F-03)

**요청**
- 주소의 `{id}`: 바꿀 할 일의 id
- 예: `PATCH /api/todos/3f2a8c1e-5b7d-4e9a-a1c2-0d4e6f8b9a01`

```json
{
  "completed": true
}
```

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| completed | boolean | O | `true`(완료) 또는 `false`(미완료) |

- "반대로 바꿔줘"가 아니라 "이 값으로 바꿔줘"를 보낸다. 같은 요청을 두 번 보내도 결과가 같다.
- 제목은 바꿀 수 없다. (수정 기능은 범위 밖)

**응답 200** (바뀐 할 일 전체)
```json
{
  "id": "3f2a8c1e-5b7d-4e9a-a1c2-0d4e6f8b9a01",
  "title": "우유 사기",
  "completed": true,
  "createdAt": "2026-10-23T00:00:00.000Z"
}
```

**에러**

| 상황 | 요청 예시 | 상태 코드 | code | message |
|---|---|---|---|---|
| JSON이 아님 | `{ completed: true` (닫는 괄호 없음) | 400 | INVALID_JSON | 요청 형식이 올바르지 않습니다. |
| completed 없음 | `{}` | 400 | VALIDATION_ERROR | completed 값이 필요합니다. |
| completed가 boolean이 아님 | `{ "completed": "yes" }` | 400 | VALIDATION_ERROR | completed는 true 또는 false여야 합니다. |
| 알 수 없는 필드 | `{ "completed": true, "title": "새 제목" }` | 400 | VALIDATION_ERROR | 허용되지 않는 필드가 있습니다: title |
| 없는 id / 형식이 틀린 id | `PATCH /api/todos/abc` | 404 | NOT_FOUND | 할 일을 찾을 수 없습니다. |
| 서버/DB 오류 | - | 500 | INTERNAL_ERROR | 서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요. |

에러 응답 예시 (없는 id):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "할 일을 찾을 수 없습니다."
  }
}
```

---

## 7. DELETE /api/todos/{id} — 할 일 삭제 (F-04)

**요청**
- 주소의 `{id}`: 지울 할 일의 id
- 예: `DELETE /api/todos/3f2a8c1e-5b7d-4e9a-a1c2-0d4e6f8b9a01`
- 본문 없음

**응답 204**
- 본문 없음 (성공했다는 상태 코드만 돌려준다)

**에러**

| 상황 | 요청 예시 | 상태 코드 | code | message |
|---|---|---|---|---|
| 없는 id / 형식이 틀린 id / 이미 지운 할 일 | `DELETE /api/todos/abc` | 404 | NOT_FOUND | 할 일을 찾을 수 없습니다. |
| 서버/DB 오류 | - | 500 | INTERNAL_ERROR | 서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요. |

---

## 8. 참고
- 정해지지 않은 메서드(예: `PUT /api/todos`)는 Next.js가 자동으로 405를 돌려준다. 이 응답은 위 에러 형식을 따르지 않는다.
- 400 에러가 여러 개 겹치면 첫 번째 에러 하나만 돌려준다.
