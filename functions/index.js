// 尚未匯出任何 Cloud Function — 見 README.md 與 suggestFileNaming.js。
// 這個檔案刻意留白，避免 `firebase deploy --only functions` 在還沒設定
// ANTHROPIC_API_KEY / 還沒確認 Blaze 方案之前，不小心部署出一個會失敗
// （或更糟：部署成功但沒有金鑰導致執行期才炸掉）的函式。
//
// 啟用時：取消 suggestFileNaming.js 裡的註解，並在這裡加上
//   export { suggestFileNaming } from './suggestFileNaming.js'
