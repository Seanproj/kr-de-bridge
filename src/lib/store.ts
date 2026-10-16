// 체크리스트 진행 상태만 localStorage에 저장 (개인정보 없음). 접근이 막힌 환경에서도 앱은 동작해야 한다.
const PREFIX = "kdb:";

export function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function writeSet(key: string, value: Set<string>) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify([...value]));
  } catch {
    /* 저장 불가 — 무시 */
  }
}

/** [data-check-group] 안의 체크박스를 localStorage와 연결한다. 변경 시 onChange(done, total) 호출 */
export function bindChecklist(root: HTMLElement, onChange?: (done: number, total: number) => void) {
  const key = root.dataset.checkGroup!;
  const boxes = [...root.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-check]")];
  const state = readSet(key);
  const emit = () => onChange?.(boxes.filter((b) => b.checked).length, boxes.length);
  for (const b of boxes) {
    b.checked = state.has(b.dataset.check!);
    b.addEventListener("change", () => {
      b.checked ? state.add(b.dataset.check!) : state.delete(b.dataset.check!);
      writeSet(key, state);
      emit();
    });
  }
  emit();
  return () => {
    state.clear();
    writeSet(key, state);
    boxes.forEach((b) => (b.checked = false));
    emit();
  };
}
