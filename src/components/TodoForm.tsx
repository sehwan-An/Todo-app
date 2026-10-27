// 할 일 제목 입력창과 추가 버튼 (COMPONENT_SPEC 2장)
export type TodoFormProps = {
  // 검증을 통과한 제목을 받아 추가를 요청한다
  onAdd: (title: string) => Promise<void>;
};

export function TodoForm(props: TodoFormProps) {
  return (
    <form>
      <input type="text" aria-label="할 일 제목" placeholder="할 일을 입력하세요" />
      <button type="submit">추가</button>
    </form>
  );
}
