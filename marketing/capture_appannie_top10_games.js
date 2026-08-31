/**
 * Palace Games Tools - App Annie Game Top 10 Excel/TSV Extractor
 * Version: v1.1.0
 * Description: Extracts top 10 grossing games from data.ai / App Annie and exports as .xls file.
 * Features: Built-in Dictionary for Chinese game name translation.
 */
(function () {
  try {
    // ==========================================
    // 0. 遊戲中文名稱字典 (可隨時自行補充與修改)
    // ==========================================
    const gameTranslationMap = {
      // 常用熱門遊戲
      "AFK Journey": "劍與遠征：啟程",
      "Brawl Stars": "荒野亂鬥",
      "Candy Crush Saga": "糖果傳奇",
      "Clash of Clans": "部落衝突",
      "Coin Master": "金幣大師",
      "Coop TD: Together": "同盟塔防戰：並肩作戰",
      "Fate/Grand Order": "Fate/Grand Order",
      "Garena 傳說對決：冥定王牌版本": "Garena 傳說對決",
      "Genshin Impact": "原神",
      "Gossip Harbor®: Merge & Story": "緋聞港口：合併&故事",
      "Heartopia": "心動小鎮",
      "Honkai: Star Rail": "崩壞：星穹鐵道",
      "Honor of Kings": "王者榮耀",
      "Kingshot": "Kingshot",
      "Last War:Survival": "Last War:Survival",
      "MapleStory : Idle RPG": "楓之谷：放置冒險記",
      "MONOPOLY GO!": "地產大亨 GO!",
      "Monster Strike": "怪物彈珠",
      "Pikmin Bloom": "Pikmin Bloom",
      "PUBG MOBILE": "絕地求生 M",
      "Puzzle & Dragons": "龍族拼圖",
      "Pokémon GO": "Pokémon GO",
      "ROBLOX": "Roblox 機器人塊體",
      "Royal Match": "皇家匹配",
      "Solo Leveling:Arise": "我獨自升級：ARISE",
      "Tower of Saviors": "神魔之塔",
      "Uma Musume Pretty Derby": "賽馬娘 Pretty Derby",
      "Whiteout Survival": "寒霜啟示錄",
      "Wuthering Waves - To Xuanfang": "鳴朝",
      "Xin Stars": "星城Online",
      "包你發": "包你發娛樂城",
      "鬥破蒼穹M：少年崛起--動畫正版授權": "鬥破蒼穹M：少年崛起",
      "星城-歡慶77幸運日": "星城Online"
    };

    // 取得中文名稱之輔助函式
    const getChineseGameName = (originalName) => {
      const trimmedName = originalName.trim();
      
      // 1. 完全比對
      if (gameTranslationMap[trimmedName]) {
        return gameTranslationMap[trimmedName];
      }

      // 2. 部分比對（若原名包含字典鍵值）
      for (const [key, value] of Object.entries(gameTranslationMap)) {
        if (trimmedName.toLowerCase().includes(key.toLowerCase())) {
          return value;
        }
      }

      // 3. 查無資料時的預設清理邏輯（去除冒號或連字號後的副標題）
      return trimmedName.split(/[:-]/)[0].trim();
    };

    // 1. 抓取過濾器容器與頁面特徵
    const container =
      document.querySelector('[class*="ReportPickersLayout__FiltersContainer"]') ||
      document.querySelector('[class*="ReportPickersLayout__StrictShrinkFlexView"]');
    const filterTxt = container ? container.innerText.trim() : '';
    const href = location.href.toLowerCase();
    const fullTxt = document.body.innerText.toLowerCase();

    // 2. 判斷平台
    let platform = 'iOS';
    if (href.includes('google') || href.includes('android') || fullTxt.includes('google play')) {
      platform = 'Google Play';
    } else if (href.includes('apple') || href.includes('ios') || href.includes('app-store')) {
      platform = 'iOS';
    }

    // 3. 驗證排行榜類型（必須為熱門暢銷排行）
    let chartType = 'ERR';
    const checkH2 = filterTxt.toLowerCase();
    if (checkH2.includes('暢銷') || checkH2.includes('畅销') || checkH2.includes('grossing')) {
      if (
        !checkH2.includes('免費') &&
        !checkH2.includes('免费') &&
        !checkH2.includes('free') &&
        !checkH2.includes('付費') &&
        !checkH2.includes('付费') &&
        !checkH2.includes('paid')
      ) {
        chartType = '熱門暢銷排行';
      }
    }

    // 4. 驗證分類（必須為遊戲）
    let category = 'ERR';
    const lines = filterTxt.split('\n').map((s) => s.trim()).filter(Boolean);
    if (
      lines.some((l) => {
        const c = l.toLowerCase().replace(/\s+/g, '');
        return c === '遊戲' || c === '游戏' || c === 'game';
      })
    ) {
      category = '遊戲';
    }

    if (chartType === 'ERR' || category === 'ERR') {
      alert('❌ 請確認排行榜與選項皆正確！（需選取「熱門暢銷排行」與「遊戲」分類）');
      return;
    }

    // 5. 日期處理 (MMDD)
    let shortDate = '';
    const dateMatch = document.body.innerText.match(/\b(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})\b/);
    if (dateMatch) {
      const m = dateMatch[2].padStart(2, '0');
      const d = dateMatch[3].padStart(2, '0');
      shortDate = `${m}${d}`;
    } else {
      const t = new Date();
      const m = String(t.getMonth() + 1).padStart(2, '0');
      const d = String(t.getDate()).padStart(2, '0');
      shortDate = `${m}${d}`;
    }

    // 6. 整理表格欄位資料
    const isAnd = platform === 'Google Play';
    const fileName = `${isAnd ? 'And遊戲前十' : 'ios遊戲前十'}-${shortDate}`;
    const titleText = `遊戲排行榜 ‧ ${shortDate}`;
    const sheetName = isAnd ? 'And' : 'ios';

    const header = ['名次'];
    for (let i = 1; i <= 10; i++) header.push(`第 ${i} 名`);

    const gameRow = ['遊戲原名'];
    const zhRow = ['遊戲中文名稱'];

    const tableRows = document.querySelectorAll('tr, div[role="row"]');
    let count = 0;

    tableRows.forEach((row) => {
      if (count >= 10) return;
      const text = row.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
      const rankMatch = text.find((t) => /^\d+$/.test(t));

      if (rankMatch && text.length >= 2) {
        const rank = parseInt(rankMatch, 10);
        if (rank > 0 && rank <= 10) {
          const nameIndex = text.findIndex((t) => t === rankMatch) + 1;
          const name = text[nameIndex] || '';
          if (name && !gameRow.includes(name)) {
            gameRow.push(name);
            
            // 使用字典翻譯中文名稱
            const cleanName = getChineseGameName(name);
            zhRow.push(cleanName);
            
            count++;
          }
        }
      }
    });

    if (count === 0) {
      alert('❌ 請確認已在暢銷排行榜且資料已完全載入！');
      return;
    }

    // 7. 構建 Excel HTML 與觸發下載
    const makeRow = (arr) => `<tr>${arr.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>table{border-collapse:collapse;}td{border:1px solid #d3d3d3;padding:4px 8px;}</style></head><body><table><tr><td colspan="11">${titleText}</td></tr><tr><td>平台</td><td colspan="10">${platform}</td></tr><tr><td>排行榜類型</td><td colspan="10">${chartType}</td></tr><tr><td>主要分類</td><td colspan="10">${category}</td></tr>${makeRow(header)}${makeRow(gameRow)}${makeRow(zhRow)}</table></body></html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    alert('擷取失敗：' + e.message);
  }
})();
