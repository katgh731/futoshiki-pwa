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
- 待辦為審查 v0.2，後續版本再加入繁體中文觸控及鍵盤介面。

[OpenAI Codex Cloud 指南](https://help.openai.com/en/articles/20001545-using-codex-cloud) · [GitHub App 安裝指南](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
