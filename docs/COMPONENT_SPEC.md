# COMPONENT_SPEC - Todo App (초안)

> 원본: docs/PRD.md, docs/API_SPEC.md, docs/DATA_MODEL.md
> 상태: 초안. "(기본값)" 표시 항목은 PRD 미정 사항이라 확인 후 확정한다.

## 1. 컴포넌트 트리

```
app/page.tsx                 페이지 진입점 (TodoApp만 보여줌)
└─ TodoApp                   상태와 API 호출 담당 ("use client")
   ├─ ErrorBanner            작업 실패 메시지 (에러가 있을 때만)
   ├─ TodoForm               제목 입력 + 추가 버튼
   └─ (상태에 따라 하나만 표시)
      ├─ 로딩 문구           처음 목록을 불러오는 중
      ├─ ErrorBanner         목록 불러오기 실패 + 다시 시도 버튼
      └─ TodoList            할 일 목록 (비어 있으면 빈 목록 문구)
         └─ TodoItem × N     체크박스 + 제목 + 삭제 버튼
```

| 컴포넌트 | 파일 | 역할 | 관련 기능 |
|---|---|---|---|
| TodoApp | src/components/TodoApp.tsx | 할 일 목록 상태를 가지고, API를 부르고, 자식에게 값과 함수를 내려준다 | F-01 ~ F-05 |
| TodoForm | src/components/TodoForm.tsx | 제목을 입력받고 화면 검증 후 TodoApp에 알린다 | F-01 |
| TodoList | src/components/TodoList.tsx | 목록을 그리거나 빈 목록 문구를 보여준다 | F-02 |
| TodoItem | src/components/TodoItem.tsx | 할 일 하나를 그린다. 체크/삭제 동작을 TodoApp에 알린다 | F-03, F-04 |
| ErrorBanner | src/components/ErrorBanner.tsx | 에러 메시지를 보여준다. 필요하면 다시 시도 버튼도 보여준다 | - |

- **상태는 TodoApp 한 곳에만 둔다.** 나머지는 받은 값을 그리고, 사용자 동작을 함수(onXxx)로 위에 알리기만 한다.
- `Todo` 타입은 DATA_MODEL.md 3장(src/types/todo.ts)을 그대로 쓴다.

## 2. Props 타입

```ts
// TodoApp: props 없음. 페이지에서 <TodoApp />로만 쓴다.

type TodoFormProps = {
  // 검증을 통과한 제목(앞뒤 공백 제거됨)을 받아 추가를 요청한다.
  // 성공하면 resolve, 실패하면 reject 된다.
  onAdd: (title: string) => Promise<void>;
};

type TodoListProps = {
  todos: Todo[];                 // 이미 최신순으로 정렬된 목록
  busyIds: string[];             // 요청 처리 중인 할 일의 id 목록
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
};

type TodoItemProps = {
  todo: Todo;
  busy: boolean;                 // true면 체크박스와 삭제 버튼을 잠근다
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
};

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;          // 있으면 "다시 시도" 버튼을 보여준다
};
```

### TodoApp 내부 상태 (참고)

| 상태 | 타입 | 설명 |
|---|---|---|
| todos | `Todo[]` | 화면에 보이는 할 일 목록 |
| status | `"loading" \| "error" \| "ready"` | 처음 목록 불러오기 상태 |
| busyIds | `string[]` | 체크/삭제 요청 중인 할 일 id |
| errorMessage | `string \| null` | 작업 실패 메시지 (ErrorBanner에 표시) |

## 3. 사용자 동작과 결과

### 3-1. 페이지 열기 (F-02, F-05)

| 단계 | 결과 |
|---|---|
| 페이지를 연다 | 로딩 문구를 보여주고 `GET /api/todos`를 요청한다 |
| 성공 | 받은 목록을 순서 그대로 보여준다. 비어 있으면 빈 목록 문구 |
| 실패 | 로딩 문구 대신 불러오기 실패 문구와 "다시 시도" 버튼을 보여준다 |
| "다시 시도" 클릭 | 다시 로딩 문구를 보여주고 목록을 다시 요청한다 |

### 3-2. 할 일 추가 (F-01)

| 동작 | 결과 |
|---|---|
| 제목 입력 후 "추가" 클릭 또는 Enter | 앞뒤 공백을 지우고 PRD "제목 규칙"으로 검사한다 |
| 검사 실패 | 입력창 아래에 검증 문구를 보여준다. 서버에 요청하지 않는다. 입력값은 그대로 둔다 |
| 검사 통과 | 추가 버튼을 "추가 중..."으로 바꾸고 잠근 뒤 `POST /api/todos`를 요청한다 |
| 요청 성공 (201) | 응답받은 할 일을 목록 맨 위에 넣는다. 입력창을 비우고 입력창에 다시 커서를 둔다 |
| 요청 실패 | 입력값은 그대로 두고 ErrorBanner에 에러 문구를 보여준다 |
| 검증 문구가 보이는 상태에서 다시 입력 | 검증 문구를 지운다 |

- 입력창에 `maxLength`는 쓰지 않는다. 브라우저는 "👍"를 2자로 세서 PRD 규칙과 다르기 때문이다.

### 3-3. 완료/미완료 전환 (F-03)

| 동작 | 결과 |
|---|---|
| 체크박스 클릭 | 해당 할 일을 busy로 표시(체크박스, 삭제 버튼 잠금)하고 `PATCH /api/todos/{id}`에 바뀐 값을 보낸다 |
| 요청 성공 (200) | 응답받은 값으로 그 할 일을 바꾼다. 완료면 제목에 취소선을 긋는다. 목록 순서는 바꾸지 않는다 (기본값) |
| 요청 실패 | 체크박스를 원래 상태로 두고 ErrorBanner에 에러 문구를 보여준다 |
| 끝나면 (성공/실패 모두) | busy 표시를 푼다 |

### 3-4. 삭제 (F-04)

| 동작 | 결과 |
|---|---|
| "삭제" 버튼 클릭 | 확인 창 없이 바로 (기본값) 해당 할 일을 busy로 표시하고 `DELETE /api/todos/{id}`를 요청한다 |
| 요청 성공 (204) | 목록에서 그 할 일을 뺀다. 마지막 하나였다면 빈 목록 문구가 보인다 |
| 요청 실패 | 목록은 그대로 두고 ErrorBanner에 에러 문구를 보여준다 |
| 끝나면 (성공/실패 모두) | busy 표시를 푼다 |

### 3-5. 작업 실패 메시지 (ErrorBanner)
- 다음 작업(추가/체크/삭제)을 시작하면 이전 메시지를 지운다.
- 메시지는 한 번에 하나만 보여준다.

## 4. 상태별 문구

### 4-1. 목록 상태

| 상태 | 문구 |
|---|---|
| 로딩 | 할 일을 불러오는 중... |
| 빈 목록 | 아직 할 일이 없어요. 위에서 첫 할 일을 추가해 보세요. |
| 불러오기 실패 | 할 일을 불러오지 못했습니다. + [다시 시도] 버튼 |

### 4-2. 입력 검증 문구 (화면 검증, API_SPEC과 같은 문구)

| 상황 | 문구 |
|---|---|
| 빈 제목 / 공백만 | 제목을 입력해 주세요. |
| 100자 초과 | 제목은 100자 이하로 입력해 주세요. |

### 4-3. 작업 실패 문구 (ErrorBanner)

| 상황 | 문구 |
|---|---|
| API가 에러 응답을 줌 (400, 404, 500) | 응답의 `error.message`를 그대로 보여준다 |
| 서버에 연결 자체를 못함 (네트워크 오류) | 서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요. |
| 응답이 에러 형식이 아님 (예: 405) | 알 수 없는 오류가 발생했습니다. |

### 4-4. 버튼과 접근성 이름

| 요소 | 보이는 글자 | 접근성 이름 (스크린리더, 테스트에서 찾는 이름) |
|---|---|---|
| 제목 입력창 | placeholder: 할 일을 입력하세요 | 할 일 제목 |
| 추가 버튼 | 추가 / 추가 중... | 추가 |
| 체크박스 | - | "{제목}" 완료 |
| 삭제 버튼 | 삭제 | "{제목}" 삭제 |
| 다시 시도 버튼 | 다시 시도 | 다시 시도 |

## 5. 버전별 차이

| 버전 | TodoApp의 데이터 처리 | 로딩 / 서버 에러 상태 |
|---|---|---|
| v0.1 | API 없이 React 상태에만 저장. id는 `crypto.randomUUID()`, createdAt은 현재 시간 | 없음 (빈 목록, 입력 검증 문구만 사용) |
| v0.2 이후 | API_SPEC.md의 API를 호출 | 위 문구 모두 사용 |

- TodoForm, TodoList, TodoItem, ErrorBanner는 버전이 바뀌어도 그대로다. TodoApp 안의 데이터 처리만 바뀐다.

## 6. 기본값으로 정한 것 (PRD 미정 사항, 확인 필요)
- 완료한 할 일은 목록에서 제자리에 두고 취소선만 긋는다.
- 삭제 시 확인 창을 띄우지 않는다.
- 화면 에러 문구는 API의 `error.message`를 그대로 쓴다. (TRD 미정 사항)
