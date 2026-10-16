// Web Share API, 미지원 시 링크 복사
export function bindShare() {
  for (const btn of document.querySelectorAll<HTMLButtonElement>("[data-share]")) {
    btn.addEventListener("click", async () => {
      const data = { title: btn.dataset.title, text: btn.dataset.text, url: location.href.split("#")[0] };
      const label = btn.querySelector("[data-share-label]");
      if (navigator.share) {
        try { await navigator.share(data); } catch { /* 사용자가 취소 */ }
        return;
      }
      try {
        await navigator.clipboard.writeText(data.url);
        if (label) { label.textContent = "링크를 복사했어요 ✓"; setTimeout(() => (label.textContent = "공유하기"), 2200); }
      } catch {
        prompt("이 링크를 복사하세요", data.url);
      }
    });
  }
}
