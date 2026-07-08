# Cloud Functions（尚未部署 / 尚未啟用）

這個資料夾是「AI 自動判讀掃描檔產生檔名」下一階段的骨架，**目前沒有被 `firebase.json` 引用，也還沒有 `npm install` 過**，純粹是先把架構寫好，等事務所確認以下兩件事之後才會真正啟用：

1. **Anthropic API 預算與金鑰**：`suggestFileNaming.js` 需要一組 `ANTHROPIC_API_KEY`（透過 `firebase functions:secrets:set ANTHROPIC_API_KEY` 設定，不要寫進程式碼或 commit 進版控）。每次判讀一份掃描檔會產生小額 API 費用。
2. **Firebase 升級到 Blaze（用量付費）方案**：Spark（免費）方案的 Cloud Functions 沒有對外網路存取權限，無法呼叫 Anthropic API。

## 啟用步驟（等上面兩件事確認後）

```bash
cd functions
npm install
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only functions
```

然後把 `src/modules/files/FileNamingForm.jsx` 裡「AI 建議（尚未啟用）」按鈕的 `disabled` 拿掉，改成呼叫 `httpsCallable(functions, 'suggestFileNaming')`，回傳值直接餵進表單既有欄位（使用者仍可全部修改再送出，不會自動覆蓋、不會自動重新命名 Storage 裡的檔案 —— 這是先前跟事務所確認過的行為）。

## `suggestFileNaming.js` 設計重點

- 輸入：Storage 檔案路徑（`cases/{caseId}/{fileId}`）。
- 只送**第一頁**（狀頭通常在首頁）給模型當圖片輸入，不是整份 PDF 轉文字 —— 存底章/收文章這類紅色印章是視覺特徵，OCR 純文字擷取不到，需要用有視覺能力的模型。
- 回傳結構化 JSON（rocDate、direction、personalDelivery、person、cause、docType、isHearingNotice、courtNameRaw、hearingDate、hearingTime、caseNumberRaw、divisionRaw），對應 `FileNamingForm.jsx` 的欄位，前端負責照 `src/data/fileNaming.js` 的規則組成最終檔名字串 —— AI 只負責「讀」，組字串的規則邏輯仍然是純程式碼，確保規則本身不會因為模型幻覺而跑掉。
- 沒有把 AI 回傳值直接當作最終答案存檔：一律先顯示在表單裡讓行政人員看過、修改後才按「存成建議檔名」，比照 `ai-review` 模組「AI 產出一律要人工核對」的既有原則。
