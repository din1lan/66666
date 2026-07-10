# 法律事務所案件管理系統 — 整站可操作預覽（靜態版）

這個資料夾只有一個 `index.html`，是離線可操作的整站預覽（純前端、資料存在瀏覽器 localStorage，
不連線任何資料庫）。放上 Render 純粹是為了讓行政能用網址打開，不用傳檔案。

## 部署到 Render 的步驟

1. 把這個資料夾整個推到一個新的 GitHub repo（例如 `law-firm-app-preview`）。
2. 到 Render 後台：New + → **Static Site**。
3. 選剛剛那個 GitHub repo。
4. Build Command 留空、Publish Directory 填 `.`（或留預設）。
5. 按 Create Static Site，等個一兩分鐘，Render 會給一個 `https://xxx.onrender.com` 的網址。
6. 把網址傳給行政，她直接開瀏覽器就能用，不用再傳檔案。

之後如果要更新內容，只要把新的 `index.html` 推到同一個 repo，Render 會自動重新部署。
# 66666
