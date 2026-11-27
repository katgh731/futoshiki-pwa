# 專案進度

## 2026-11-26 · v0.1

- 使用 Codex 管理規劃、開發、測試、版本及部署。透過 GitHub 工作分支和 Pull Request 審查，維持零額外成本，優先使用 iPhone 或 iPad。
- 核心引擎的原始提交為 `29798a16382c756b1f7ecc71491ce0916be88bfd`，位於 `feat/v0.1-solver`。Node.js 24.22.3 執行 `node --test --test-isolation=none`，31 項通過，0 項失敗，耗時 60.95 毫秒。
- 已核對 `origin` 指向 `https://github.com/katgh731/futoshiki-pwa.git`，可讀取公開遠端的 `main`。Git HTTPS 推送收到 403，GitHub 回報拒絕帳戶 `katgh731` 的操作。GitHub 連接器建立分支和 Git tree 同樣收到 403，已安裝儲存庫搜尋亦未列出本專案。
- 專案擁有人回報 ChatGPT Codex Connector 已出現在 Authorized GitHub Apps，但未出現在 Installed GitHub Apps。安裝前的檢查顯示 Connector 尚未取得此儲存庫的寫入權限。專案擁有人在 iPhone 的 GitHub 安裝頁選擇 Only select repositories，只選取本專案並完成授權。其後 Codex 確認擁有推送權限，GitHub 接受推送。
- v0.1 工作分支已推送，並建立指向 `main` 的 [PR #1](https://github.com/katgh731/futoshiki-pwa/pull/1) 供審查。v0.1 已完成審查，並在專案擁有人確認後合併至 `main`，合併提交為 `cd94bac`。

- 審查 GitHub PR 版本 `0ab1c0d`，未發現阻礙合併的問題。正式測試重跑 31 項全數通過，耗時 63.92 毫秒。另枚舉全部 576 個 4×4 拉丁方陣，交叉驗證 1,000 道題目及 3,027 組搜尋預算。365 組在已找到一解但未能確認解數時正確回傳 `unknown`。

## v0.2 · 隨機出題

- 已從 `cd94bac` 建立 GitHub 分支 `feat/v0.2-generator`。
- 已完成 4×4 至 9×9 裝置端隨機出題。只有求解器證明為唯一解且達到指定線索數量的題目才會交付。簡單、中等、困難分別保留 65%、45%、35% 的數字線索，實際遊玩難度留待介面完成後驗證。
- Node.js 24.22.3 正式測試 53 項通過、0 項失敗，耗時 188.56 毫秒。
- 8×8 和 9×9 各三個難度，每組 100 個固定種子，共 600 道全部成功。8×8 的 p95 依序為 1.59、1.20、1.98 毫秒，9×9 為 1.14、1.57、5.92 毫秒。使用 `node scripts/benchmark-generator.mjs` 可重跑。手機瀏覽器耗時尚未測量。
- [PR #2](https://github.com/katgh731/futoshiki-pwa/pull/2) 已審查提交 `3f30925`，未發現阻礙合併的問題，已合併至 `main`（`8b76f44`）。重跑 53 項測試全數通過，耗時 190.84 毫秒。另以 576 個 4×4 拉丁方陣獨立驗證 300 道題目的唯一解。重跑效能測試，8×8 與 9×9 共 600 道全數產出。

## v0.3 · 遊戲介面

- 已完成繁體中文靜態介面，提供 4×4 至 9×9、簡單／中等／困難、按鈕及鍵盤輸入與答案檢查。
- 53 項測試全部通過，耗時 189.65 毫秒。另以 DOM 事件模擬驗證 18 種尺寸與難度組合的出題及答題流程。
- 雲端預覽服務因無法監聽連接埠而未能啟動。實際瀏覽器版面、觸控及跨裝置測試待驗證。

## v0.4 · PWA 基礎

- [PR #3](https://github.com/katgh731/futoshiki-pwa/pull/3) 已改以 `main` 為基底。
- 已加入 PWA manifest、暫用安裝圖示、Service Worker 及 GitHub Pages 靜態設定。53 項自動化測試通過，另模擬根目錄和 GitHub Pages 子路徑的快取安裝、離線載入及舊版本清理。
- PR #3、#4 已合併至 `main`，PWA 合併提交為 `0650547`。2026-11-27 已啟用 GitHub Pages（`main` 的根目錄），並確認公開首頁及全部 PWA 資產回傳 HTTP 200。專案擁有人已在 iPhone 實測加入主畫面及斷網開新題，兩項均通過。基本架構已完成驗收，可進入美術設計。
- [已部署的遊戲](https://katgh731.github.io/futoshiki-pwa/)

## 遊戲操作調整

- 每對水平或垂直相鄰格均顯示不等號，出題仍逐步驗證唯一解。
- 填錯即以紅字提示，全盤答對自動鎖定棋盤並詢問是否開新題。已更新離線快取版本。
- PR #5 已合併至 `main`（`84f88d7`）並由 GitHub Pages 發布。公開網站 18 組尺寸與難度通過 Chromium 觸控模擬，另通過斷網重載及產生 9×9 困難題。專案擁有人已在公開遊戲實測，確認全部相鄰格不等號、錯誤數字紅字，以及全盤答對後的完成視窗。

## 美術設計

- 第一版採用暖白紙面、墨藍及橙色。重新設計棋盤、設定、數字鍵盤、完成視窗及安裝圖示，並更新離線快取版本。
- 52 項自動化測試全數通過。Chromium 驗證 320、390、768、1440 像素寬度下的 4×4 至 9×9 共 24 組版面。

- 依參考圖加入自製白色纖維紙紋和原創手寫 1–9 筆畫。填數時播放筆順動畫，尊重系統的減少動態設定。紙紋與字形已納入離線快取，Chromium 已驗證離線載入。

[OpenAI Codex Cloud 指南](https://help.openai.com/en/articles/20001545-using-codex-cloud) · [GitHub App 安裝指南](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
