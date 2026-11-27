# futoshiki-pwa

不等式數獨 PWA — 無限題目生成及唯一解驗證

專案目標是以 HTML、CSS 和 JavaScript 提供繁體中文遊戲，支援 iPhone、iPad、Android 和電腦。遊戲預計透過免費 GitHub Pages 寄存，支援 PWA 安裝及離線遊玩，並在裝置上產生 4×4 至 9×9 的不同難度題目。每道發布的題目都須證明具有唯一解。專案採用靜態寄存，無需付費 API、伺服器或第三方付費服務。

## v0.1 核心引擎

`src/solver.mjs` 是無依賴的 JavaScript ES 模組，提供求解、解數分類及完整答案驗證。引擎使用位元遮罩表示每格的候選數字，反覆傳播橫行、直行與不等式限制。需要分支時，優先選擇候選數最少的格子（MRV），再回溯搜尋。

```js
import { solvePuzzle, validateSolution } from './src/solver.mjs';

const puzzle = {
  size: 4,
  givens: [
    [0, 2, 3, 4],
    [2, 3, 4, 1],
    [3, 4, 1, 2],
    [4, 1, 2, 3],
  ],
  inequalities: [
    { less: [0, 0], greater: [0, 1] },
    { less: [0, 0], greater: [1, 0] },
  ],
};

const result = solvePuzzle(puzzle, { maxNodes: 10_000 });
if (result.status === 'unique') {
  console.log(result.solutions[0]);
  console.log(validateSolution(puzzle, result.solutions[0]));
}
```

- `size` 為 4 至 9 的整數，`givens` 為正方形二維陣列。格值 `0` 代表空格，其餘格值介於 `1` 和 `size`。
- `inequalities` 可省略。每條限制使用從零起算的 `[行, 列]` 座標，表示 `less` 格必須小於水平或垂直相鄰的 `greater` 格。
- `maxNodes` 是非負安全整數，預設為 10,000。根節點也計入預算，每個節點執行一次完整的約束傳播。這是可重現的節點上限，執行時間會因裝置和題目而異。
- `solvePuzzle` 回傳 `{ status, solutions, nodesVisited }`。格式合法但條件互相矛盾的題目可以證明無解。格式違規的輸入會拋出 `TypeError`。
- `validateSolution(puzzle, solution)` 接受每格皆為 `1` 至 `size` 的完整棋盤。若答案符合給定值、各行各列不重複及所有不等式，回傳 `true`，否則回傳 `false`。格式違規時拋出 `TypeError`。

| `status` | 判定 | `solutions` |
| --- | --- | --- |
| `none` | 已證明無解 | 空陣列 |
| `unique` | 已證明有且只有一解 | 一個棋盤 |
| `multiple` | 已找到至少兩解 | 兩個不同棋盤 |
| `unknown` | 搜尋尚未確認結果便用盡預算 | 零個或一個已找到的棋盤 |

## v0.2 隨機出題

```js
import { generatePuzzle } from './src/generator.mjs';

const result = generatePuzzle(9, { difficulty: 'hard' });
if (result.status === 'generated') {
  console.log(result.puzzle);
}
```

出題器在裝置端隨機排列循環拉丁方陣的行、列和數字，為每對水平及垂直相鄰格建立不等式，再按隨機次序移除數字線索。每次移除都須通過求解器的唯一解判定。若判為多解、無解或未能確認，便保留該線索。這個方法從循環方陣的排列取樣。

| `difficulty` | 難度 | 保留的數字線索比例 |
| --- | --- | --- |
| `easy` | 簡單 | 65% |
| `medium` | 中等（預設） | 45% |
| `hard` | 困難 | 35% |

數字線索數量向上取整。難度按數字線索密度估算，每個難度均顯示所有相鄰格的不等式。玩家實際感受仍待遊戲介面完成後驗證。

- 成功時回傳 `{ status: 'generated', puzzle, solution, difficulty, givensCount, nodesVisited, attempts }`。其中 `nodesVisited` 是最後一次唯一解驗證的搜尋節點數。
- `maxAttempts` 為生成候選題目的次數上限，預設 8。每次最多檢查 `size²` 次線索移除。
- `maxNodes` 是每次求解的搜尋節點上限，預設 1,000。預算內達不到難度線索數量時，回傳 `{ status: 'exhausted', attempts }`；上限為零時直接回傳 `attempts: 0`。
- `random` 預設為 `Math.random`，可傳入回傳 `[0, 1)` 內數字的亂數函式以重現題目。格式非法時拋出 `TypeError`。

使用以下指令測量 8×8、9×9 出題。每個尺寸及難度使用 100 個固定種子，另先暖機 10 次，報告成功數、耗盡數、嘗試次數和耗時。這是 Node.js 環境的測量。

```sh
node scripts/benchmark-generator.mjs
```

## 執行測試

使用 Node.js 22 或以上版本，無需安裝套件。

```sh
node --test --test-isolation=none
```

測試包含無解、唯一解、多解、非法輸入、完整答案驗證及節點預算。獨立的逐列排列解法按固定次序枚舉數字，只檢查已填入的數字，並比較解數分類及唯一解棋盤。交叉驗證涵蓋所有尺寸的固定案例及 120 道可重現的 4×4 隨機案例。

## v0.3 遊戲介面

使用靜態 HTTP 伺服器提供專案根目錄，再開啟首頁。例如在本機執行 `python3 -m http.server 8000`，然後開啟 `http://localhost:8000`。

選擇 4×4 至 9×9 棋盤及簡單、中等、困難，再按「新題目」。點選格子後可用數字按鈕填寫，或按「擦除」移去數字。鍵盤可用方向鍵移動、數字鍵填寫，以及 Backspace、Delete 或 0 擦除。填錯會即時顯示紅字。全盤正確時，遊戲會鎖定棋盤並詢問是否開新題。

## v0.4 PWA 與 GitHub Pages

GitHub Pages 使用儲存庫的 **Settings → Pages → Deploy from a branch**，選擇 `main` 及 `/(root)`。部署完成後可使用 `https://katgh731.github.io/futoshiki-pwa/`。安裝入口由瀏覽器提供。iPhone 或 iPad 可在 Safari 使用分享選單的「加入主畫面」。

首次須透過 HTTPS 或本機的 `localhost` 開啟，讓 Service Worker 安裝並快取遊戲檔案。完成後可斷線重新開啟首頁及產生新題目。修改快取檔案時，請同步更新 `sw.js` 的快取版本。安裝圖示採用與介面一致的墨藍底、暖白棋格和橙色標記。
