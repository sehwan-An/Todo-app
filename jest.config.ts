import type { Config } from "jest";
import nextJest from "next/jest.js";

// next.config.ts와 .env 파일을 테스트에서도 읽도록 Next.js 설정을 불러온다
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  // 테스트 안에서 브라우저 환경을 흉내 낸다
  testEnvironment: "jsdom",
  // 모든 테스트 전에 실행할 파일
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // "@/..." 경로를 src 폴더로 연결한다 (tsconfig.json의 paths와 같게)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
