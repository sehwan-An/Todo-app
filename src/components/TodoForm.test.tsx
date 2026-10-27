import { render, screen } from "@testing-library/react";
import { TodoForm } from "@/components/TodoForm";

describe("TodoForm", () => {
  it("C-FORM-01 처음 화면에 입력창과 추가 버튼이 보인다", () => {
    // 가짜 onAdd 함수 (이 테스트에서는 호출 여부를 보지 않는다)
    render(<TodoForm onAdd={jest.fn<Promise<void>, [string]>()} />);

    // 입력창은 접근성 이름 "할 일 제목"으로 찾는다 (COMPONENT_SPEC 4-4)
    const input = screen.getByRole("textbox", { name: "할 일 제목" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "할 일을 입력하세요");

    expect(screen.getByRole("button", { name: "추가" })).toBeInTheDocument();
  });
});
