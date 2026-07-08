// ============================================================================
// 骨架 / 尚未啟用 — 見 functions/README.md
// ============================================================================
// 這支 Cloud Function 還沒有被 index.js 匯出、也還沒有 npm install 過依賴，
// 純粹是先把「AI 讀掃描檔第一頁 → 回傳結構化欄位」這個介面的形狀定下來，
// 等事務所確認 Anthropic API 預算並把 Firebase 升級到 Blaze 方案後再啟用。
//
// 設計原則（呼應 src/modules/ai-review 既有的「AI 產出必須人工核對」慣例）：
//   - 只讀「第一頁」，因為狀頭資訊通常在首頁，且送整份 PDF 會不必要地增加
//     費用與延遲。
//   - 用視覺輸入（圖片），不是純文字 OCR —— 存底章/收文章是紅色印章視覺
//     特徵，OCR 文字擷取抓不到「這是不是收文章」這種版面/顏色資訊。
//   - 回傳值是「建議」，前端一定要讓人看過、可修改，才會真的存成
//     suggestedFileName。這支函式本身完全不碰 Storage 裡的實際檔名。
//
// import { onCall } from 'firebase-functions/v2/https'
// import Anthropic from '@anthropic-ai/sdk'
//
// export const suggestFileNaming = onCall(
//   { secrets: ['ANTHROPIC_API_KEY'] },
//   async (request) => {
//     const { storagePath } = request.data // 例：'cases/{caseId}/{fileId}.pdf'
//     if (!storagePath) throw new Error('缺少 storagePath')
//
//     // 1. 從 Storage 下載該檔案，用 pdf 轉圖工具只轉出第一頁圖片（base64）。
//     //    （伺服器端沒有 DOM，不能沿用前端的 pdfjsSetup.js，需要另找
//     //    Node 相容的轉檔工具，例如 pdf-to-img 或呼叫外部轉檔服務。）
//     const firstPageImageBase64 = await renderFirstPageAsImage(storagePath)
//
//     // 2. 呼叫 Claude，要求嚴格回傳 JSON（符合 FileNamingForm.jsx 的欄位）。
//     const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
//     const response = await anthropic.messages.create({
//       model: 'claude-sonnet-4-5',
//       max_tokens: 1024,
//       messages: [
//         {
//           role: 'user',
//           content: [
//             { type: 'image', source: { type: 'base64', media_type: 'image/png', data: firstPageImageBase64 } },
//             { type: 'text', text: FILE_NAMING_PROMPT },
//           ],
//         },
//       ],
//     })
//
//     // 3. 解析並回傳結構化欄位，不在後端組最終檔名字串 —— 組字串的規則
//     //    邏輯留在前端 src/data/fileNaming.js，維持「規則是純程式碼、AI
//     //    只負責讀」的分工，避免規則被模型幻覺覆蓋。
//     return parseModelJson(response)
//   },
// )
//
// const FILE_NAMING_PROMPT = `
// 你是事務所的行政助理。這是一份法律文件掃描檔的第一頁。請判斷並用 JSON 回傳：
// rocDate（民國年 YYY.MM.DD，格式須符合文件上蓋章或標示的日期）、
// direction（"出狀" 或 "收文"，出狀的判斷依據是右上角是否有「存底」字樣，
// 收文的判斷依據是否蓋有「大恆國際法律事務所」收發章）、
// personalDelivery（布林值，僅在 direction 為「出狀」且同時蓋有收文章時為 true）、
// person（我方當事人姓名，只有委任程立全律師、陳愷閎律師、林紫彤律師或
// 王雅楨律師的一方才算我方，無法判斷時填 "(無法判斷)"，不要用你自己的推論
// 硬填一個名字）、
// cause（案由，須完整照書狀內文記載，不可自行簡寫）、
// docType（狀別或公文名稱，取文件第一列/標題原文）、
// isHearingNotice（布林值，文件是否為開庭通知）、
// courtNameRaw（法院或機關全名原文）、hearingDate、hearingTime（若為開庭通知）、
// caseNumberRaw、divisionRaw（案號與股別原文，未記載則留空字串，不要自己編造）。
// 對任何看不清楚或無法確定的欄位，寧可回傳空字串或 "(無法判斷)"，也不要用你的
// 推測填入 —— 這份檔名會被事務所拿去做法律文件歸檔，錯誤的猜測比空白更危險。
// `
