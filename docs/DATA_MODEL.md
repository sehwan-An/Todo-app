# DATA_MODEL - Todo App (초안)

> 원본: docs/PRD.md, docs/TRD.md
> 상태: 초안. "미정" 표시 항목은 결정 후 갱신한다.

## 1. 테이블 목록

| 테이블 | 설명 | 관련 기능 |
|---|---|---|
| todos | 할 일 하나 = 행 하나 | F-01 ~ F-05 |

- 로그인이 없고(범위 밖) 사용자가 1명이므로 users 테이블은 두지 않는다.
- 카테고리, 마감일도 범위 밖이므로 관련 테이블/필드를 두지 않는다.

## 2. todos

| 필드 | 타입 (MySQL) | 제약조건 | 설명 |
|---|---|---|---|
| id | CHAR(36) | PRIMARY KEY, DEFAULT (UUID()) | 할 일을 구분하는 고유 값(uuid 문자열). DB가 자동으로 만든다. |
| title | VARCHAR(100) | NOT NULL, CHECK (CHAR_LENGTH(title) BETWEEN 1 AND 100) | 할 일 제목. 앞뒤 공백을 지운 값, 1~100자. (F-01) |
| completed | BOOLEAN | NOT NULL, DEFAULT FALSE | 완료 여부. 처음엔 미완료. (F-03) |
| created_at | TIMESTAMP(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | 만든 시간(밀리초까지). 최신순 정렬 기준. (F-02) |

- 테이블 문자셋: `utf8mb4` (한글과 이모지를 모두 저장하려면 필요)
- MySQL 8.0.16 이상 필요 (`DEFAULT (UUID())`와 CHECK 제약이 이 버전부터 제대로 동작)

**MySQL 타입 메모 (초보자용)**
- **CHAR(36)**: MySQL에는 uuid 전용 타입이 없어서, uuid를 36자 문자열로 저장한다.
- **BOOLEAN**: MySQL 안에서는 TINYINT(1)로 저장되어 0(false) / 1(true)로 보인다. Drizzle이 true/false로 바꿔준다.
- **TIMESTAMP(3)**: 시간을 UTC로 저장하고, 밀리초까지 기록해 빠르게 연속 추가해도 순서가 구분된다. 2038년까지만 저장할 수 있지만 이 앱에는 충분하다.

**설계 메모**
- **id를 uuid로 한 이유**: v0.1(브라우저)과 v0.2(서버 메모리)에서도 `crypto.randomUUID()`로 같은 모양의 id를 만들 수 있어서, 버전이 바뀌어도 id 타입이 그대로다.
- **updated_at은 두지 않음**: 제목 수정 기능이 범위 밖이고, 완료 전환 시간을 쓰는 기능도 없다.
- **삭제는 실제 삭제**: 행을 지운다. "삭제됨" 표시만 하는 방식(soft delete)은 쓰지 않는다. (F-04)
- **인덱스는 기본키만**: 혼자 쓰는 앱이라 데이터가 적어서 created_at 인덱스는 필요 없다.
- **이름 규칙**: DB 필드는 snake_case(created_at), TypeScript는 camelCase(createdAt). Drizzle에서 둘을 연결한다.

## 3. TypeScript 타입 예시

`src/types/todo.ts`에 둘 공유 타입 예시.

```ts
// 할 일 하나 (API 응답, 화면에서 쓰는 모양)
export type Todo = {
  id: string;        // uuid
  title: string;     // 앞뒤 공백 없음, 1~100자 (코드 포인트 기준)
  completed: boolean;
  createdAt: string; // ISO 형식 시간 문자열 (예: "2026-10-23T09:00:00.000Z")
};

// 할 일 추가 요청 (F-01): 제목만 보낸다. 나머지는 서버/DB가 채운다.
export type CreateTodoInput = {
  title: string;
};

// 완료 상태 전환 요청 (F-03)
export type UpdateTodoInput = {
  completed: boolean;
};
```

- `createdAt`이 `Date`가 아니라 `string`인 이유: 서버가 JSON으로 응답할 때 시간은 문자열로 바뀐다. 화면에서는 이 문자열을 받는다.
- DB에서 읽은 행(Drizzle 타입)에서는 `createdAt`이 `Date`다. API 응답으로 보낼 때 문자열로 바꾼다.
- 제목 규칙(1~100자)은 타입으로 표현할 수 없으므로 Zod 스키마(src/lib)에서 검사한다.

## 4. 예시 데이터

| id | title | completed | created_at |
|---|---|---|---|
| 3f2a...e1 | 우유 사기 | 0 (false) | 2026-10-23 00:00:00.000 (UTC) |
| 9b7c...4d | PRD 쓰기 | 1 (true) | 2026-10-22 09:30:00.000 (UTC) |

## 5. 제목 저장 규칙
PRD "제목 규칙"을 따른다.
- 저장 전에 앞뒤 공백을 지운다. DB에는 앞뒤 공백이 없는 값만 들어간다.
- 글자 수는 코드 포인트 단위로 센다. MySQL(utf8mb4)의 `CHAR_LENGTH`와 같은 기준이다.
  - 예: "👍"는 1자. (JavaScript `length`는 2로 세므로 Zod 검증에서 따로 맞춘다. TRD 6장 참고)
- 그래서 화면 검증(Zod)을 통과한 제목은 DB CHECK 제약도 항상 통과한다.
