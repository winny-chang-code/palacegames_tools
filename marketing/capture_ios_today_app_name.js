(() => {
  const e = document.querySelectorAll('a[href*="/app/"]'),
    t = [];
  e.forEach((e) => {
    const s = e.innerText
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e && "檢視" !== e);
    if (s.length > 0) {
      const e = s[0];
      t.includes(e) || t.push(e);
    }
  });
  const s = t.join("、");
  prompt(`✅ 已成功抓取全頁共 ${t.length} 款遊戲！\n請按下 Ctrl+C 複製下方文字：`, s);
})();
