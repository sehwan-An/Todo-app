# CLAUDE.md - Todo App

## 프로젝트 개요
혼자 쓰는 간단한 할 일 목록 웹 앱 (초보자 학습용)

## MVP 범위
- 할 일 추가 (제목 필수, 앞뒤 공백 제거 후 1~100자. 자세한 규칙은 PRD "제목 규칙")
- 할 일 목록 보기 (최신순)
- 완료/미완료 전환 (체크박스)
- 할 일 삭제
- 새로고침해도 데이터 유지

## 지금은 만들지 않는 것
- 로그인, 공유, 알림, 마감일, 카테고리

## 버전 로드맵
- v0.1 화면만 (브라우저 메모리)
- v0.2 API 연결 (서버 메모리)
- v0.3 DB 저장
- v0.4 필터와 수정
- v1.0 배포
- 현재 버전의 범위를 넘는 작업(예: v0.1에서 DB 연결)은 하지 말 것

## 기술 스택
- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS
- DB: MySQL 8 + Drizzle ORM (v0.3부터)
- 검증: Zod
- 테스트: Jest + React Testing Library

## 폴더 구조
- app/ : 페이지와 API 라우트
- src/components/ : 화면 컴포넌트
- src/lib/ : 서버 로직, DB
- src/types/ : 공유 타입
- docs/ : 명세 문서

## 반드시 참고할 문서
- docs/IDEA.md : 아이디어와 로드맵 (원본)
- docs/PRD.md, docs/TRD.md, docs/DATA_MODEL.md
- docs/API_SPEC.md, docs/COMPONENT_SPEC.md, docs/TEST_CASES.md
- 위 문서 중 아직 없는 것이 있거나 명세가 모호하면, 추측하지 말고 먼저 물어볼 것

## 규칙
- 명세에 없는 기능을 임의로 추가하지 말 것
- any 타입 금지
- 한 번에 한 기능만 작업하고, 끝나면 무엇을 바꿨는지 요약할 것
- 테스트를 삭제하거나 skip하지 말 것
- 테스트가 실패하면 테스트가 아닌 구현을 고칠 것
- console.log는 디버깅 후 제거할 것
- 초보자가 이해할 수 있게 주석은 한국어로 짧게

## 자주 쓰는 명령
- 개발 서버: npm run dev
- 테스트: npm test
