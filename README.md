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

## 執行測試

使用 Node.js 22 或以上版本，無需安裝套件。

```sh
node --test --test-isolation=none
```

測試包含無解、唯一解、多解、非法輸入、完整答案驗證及節點預算。獨立的逐列排列解法按固定次序枚舉數字，只檢查已填入的數字，並比較解數分類及唯一解棋盤。交叉驗證涵蓋所有尺寸的固定案例及 120 道可重現的 4×4 隨機案例。

## 後續版本規劃

- v0.2 在裝置端產生隨機題目，設計難度分級，經求解器證明唯一後才採用題目。
- v0.3 建立繁體中文遊戲介面，支援觸控及鍵盤，並驗證不同螢幕尺寸。
- v0.4 加入 PWA 安裝、離線快取和 GitHub Pages 部署，實測各目標平台。
