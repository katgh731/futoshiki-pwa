# 專案進度

## 2026-11-26 · v0.1

- 使用 Codex 管理規劃、開發、測試、版本及部署。透過 GitHub 工作分支和 Pull Request 審查，維持零額外成本，優先使用 iPhone 或 iPad。
- 核心引擎的原始提交為 `29798a16382c756b1f7ecc71491ce0916be88bfd`，位於 `feat/v0.1-solver`。Node.js 24.22.3 執行 `node --test --test-isolation=none`，31 項通過，0 項失敗，耗時 60.95 毫秒。
- 已核對 `origin` 指向 `https://github.com/katgh731/futoshiki-pwa.git`，可讀取公開遠端的 `main`。Git HTTPS 推送收到 403，GitHub 回報拒絕帳戶 `katgh731` 的操作。GitHub 連接器建立分支和 Git tree 同樣收到 403，已安裝儲存庫搜尋亦未列出本專案。
- 專案擁有人回報 ChatGPT Codex Connector 已出現在 Authorized GitHub Apps，但未出現在 Installed GitHub Apps。目前最可能缺少個人帳戶下的 App 安裝或此儲存庫的安裝授權。GitHub 端實際安裝範圍和授權後的推送結果仍待確認。
- 待辦：在 GitHub 將 Connector 安裝至擁有人帳戶並只選取本專案，核對授權後推送現有分支，再驗證遠端包含原始提交並建立指向 `main` 的 Pull Request。確認 v0.1 已保存在 GitHub 後才開始 v0.2。

[OpenAI Codex Cloud 指南](https://help.openai.com/en/articles/20001545-using-codex-cloud) · [GitHub App 安裝指南](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
