// ============================================================================
// 結案簡表歷史資料 — 從 Google Sheet「案件管理表」的「結案簡表」分頁匯入
// ============================================================================
// 匯入時間：2026-07-08。來源：使用者提供的 Google Sheet 連結，讀取到的是
// gid=1551802964 這個分頁（表頭：結案日期／結案日期(判決)／當事人姓名／
// 案由／案號／結案文件），依 陳/林/王/程律師 四個區塊分類。這份資料是「快照」
// ——匯入之後這個檔案不會再自動同步 Google Sheet，之後新的結案紀錄請直接在
// 網站的「結案案件表」頁面登記，不要再改 Google Sheet（這是使用者在規劃時
// 選擇的方向：網站匯入歷史資料後即為主要資料來源）。
//
// 欄位說明（維持原始 Sheet 的兩欄日期設計，交給 closedCaseImport.js 正規化）：
//   closedDateRaw         — 結案日期欄（通常是非判決類文件的結案日期）
//   closedDateJudgmentRaw — 結案日期(判決)欄（判決類文件的結案日期）
//   caseNumberRaw         — 可能包含多個案號（原始 Sheet 儲存格內用換行或頓號分隔）
//   note                  — 備註，內含「不報結」「不報事務所案件」等會被
//                            closedCaseImport.js 用來設定 excludeFromReporting 的關鍵字
export const CLOSED_CASES_SEED = [
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "114.02.10",
    "person": "林秀維等",
    "cause": "認可收養",
    "caseNumberRaw": "113司養聲336",
    "closingDocument": "桃園地院民事裁定",
    "note": "撰狀未委任，不報結"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "114.02.08",
    "person": "江文榮",
    "cause": "改定未成年子女\n權利義務行使負擔等",
    "caseNumberRaw": "113家親聲655",
    "closingDocument": "新北地院民事裁定",
    "note": "撰狀未委任，不報結"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.03.06",
    "closedDateJudgmentRaw": "",
    "person": "王寶萱",
    "cause": "損害賠償",
    "caseNumberRaw": "113訴288",
    "closingDocument": "士林地院民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.03.07",
    "closedDateJudgmentRaw": "",
    "person": "蔡彥量",
    "cause": "違反銀行法",
    "caseNumberRaw": "114偵747",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.03.19",
    "closedDateJudgmentRaw": "",
    "person": "空職工",
    "cause": "不當勞動行為爭議",
    "caseNumberRaw": "114審裁285",
    "closingDocument": "憲法法庭裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.03.25",
    "closedDateJudgmentRaw": "",
    "person": "林千禾",
    "cause": "違反稅捐稽徵法等",
    "caseNumberRaw": "113偵46598\n113偵61936\n112偵49705\n114偵1177\n114偵7419",
    "closingDocument": "新北地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.02",
    "closedDateJudgmentRaw": "",
    "person": "簡廷恩",
    "cause": "違反毒品危害防制條例",
    "caseNumberRaw": "113偵17604\n113偵59611\n113偵62482",
    "closingDocument": "新北地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.02",
    "closedDateJudgmentRaw": "",
    "person": "徐瑋翔",
    "cause": "離婚等",
    "caseNumberRaw": "113家調2272\n114家調525\n114家非調343",
    "closingDocument": "新北地院調解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.09",
    "closedDateJudgmentRaw": "",
    "person": "愷閎哥",
    "cause": "詐欺等",
    "caseNumberRaw": "113偵46137",
    "closingDocument": "桃園地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.10",
    "closedDateJudgmentRaw": "",
    "person": "林志威",
    "cause": "拆屋還地調解",
    "caseNumberRaw": "113司調23",
    "closingDocument": "基隆地院民事裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.22",
    "closedDateJudgmentRaw": "",
    "person": "林宥緯",
    "cause": "傷害等",
    "caseNumberRaw": "113調偵1540",
    "closingDocument": "士林地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.22",
    "closedDateJudgmentRaw": "",
    "person": "林宥緯",
    "cause": "妨害公務",
    "caseNumberRaw": "",
    "closingDocument": "士林地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.22",
    "closedDateJudgmentRaw": "",
    "person": "許錦隆",
    "cause": "公共危險",
    "caseNumberRaw": "114偵8329",
    "closingDocument": "新北地檢緩起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.23",
    "closedDateJudgmentRaw": "",
    "person": "王郁盛",
    "cause": "聲請核發通常保護令",
    "caseNumberRaw": "114家護9",
    "closingDocument": "士林地院通常保護令",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.24",
    "closedDateJudgmentRaw": "",
    "person": "張文萍",
    "cause": "偽造文書",
    "caseNumberRaw": "113易433",
    "closingDocument": "士林地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.04.29",
    "closedDateJudgmentRaw": "",
    "person": "連智龍",
    "cause": "拆屋還地",
    "caseNumberRaw": "113訴638",
    "closingDocument": "基隆地院和解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.02",
    "closedDateJudgmentRaw": "",
    "person": "張早光",
    "cause": "性騷擾",
    "caseNumberRaw": "114偵787",
    "closingDocument": "基隆地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.05",
    "closedDateJudgmentRaw": "",
    "person": "簡廷恩",
    "cause": "違反毒品危害防制條例",
    "caseNumberRaw": "114偵17259",
    "closingDocument": "新北地檢移送併辦意旨書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.07",
    "closedDateJudgmentRaw": "",
    "person": "空職工(參加人)",
    "cause": "不當勞動行為爭議",
    "caseNumberRaw": "113再37",
    "closingDocument": "最高行院判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.12",
    "closedDateJudgmentRaw": "",
    "person": "空職工",
    "cause": "請求損害賠償",
    "caseNumberRaw": "113台上1906",
    "closingDocument": "最高法院民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.12",
    "closedDateJudgmentRaw": "",
    "person": "錦達事業",
    "cause": "發展觀光條例",
    "caseNumberRaw": "113訴711",
    "closingDocument": "北高行院判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.19",
    "closedDateJudgmentRaw": "",
    "person": "林安樺",
    "cause": "損害賠償",
    "caseNumberRaw": "114司刑移調357",
    "closingDocument": "雲林地院調解筆錄",
    "note": "義務案件，不報事務所案件"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.05.23",
    "closedDateJudgmentRaw": "",
    "person": "吳宜達、蔡政豪",
    "cause": "侵佔",
    "caseNumberRaw": "114上易39",
    "closingDocument": "高等法院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.02",
    "closedDateJudgmentRaw": "",
    "person": "李欣泰",
    "cause": "詐欺等",
    "caseNumberRaw": "113偵6891\n113偵16793\n113偵17706",
    "closingDocument": "彰化地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.04",
    "closedDateJudgmentRaw": "",
    "person": "許雅晶",
    "cause": "家庭暴力罪之妨害性自主",
    "caseNumberRaw": "113偵52640、\n113偵52649",
    "closingDocument": "桃園地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.09",
    "closedDateJudgmentRaw": "",
    "person": "基隆市立建德幼兒園",
    "cause": "履約爭議調解",
    "caseNumberRaw": "調1130446",
    "closingDocument": "工程會函",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.12",
    "closedDateJudgmentRaw": "",
    "person": "倪俊祥、阮氏鮮",
    "cause": "重傷害",
    "caseNumberRaw": "114偵1500",
    "closingDocument": "基隆地檢起訴書",
    "note": "義務案件，不報事務所案件"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.13",
    "closedDateJudgmentRaw": "",
    "person": "謝承佑",
    "cause": "妨害自由等",
    "caseNumberRaw": "114偵22949",
    "closingDocument": "桃園地檢不起訴處分書",
    "note": "遞委任狀就結案未收費，不報事務所案件"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.13",
    "closedDateJudgmentRaw": "",
    "person": "毛榤鋐",
    "cause": "侵權行為損害賠償",
    "caseNumberRaw": "113竹東簡44",
    "closingDocument": "民事撤回告訴狀",
    "note": "撤告沒有案件紀錄，不報結"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.06.27",
    "closedDateJudgmentRaw": "",
    "person": "曲佳雲、桃園產總、長榮工會",
    "cause": "不當勞動行為爭議",
    "caseNumberRaw": "113勞裁38",
    "closingDocument": "勞動部函文附裁決決定書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.02",
    "closedDateJudgmentRaw": "",
    "person": "賴正培",
    "cause": "違反貪汙治罪條例等",
    "caseNumberRaw": "112偵8377、\n112偵17147、\n113偵16026",
    "closingDocument": "士林地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.03",
    "closedDateJudgmentRaw": "",
    "person": "李欣泰",
    "cause": "詐欺等",
    "caseNumberRaw": "114訴75",
    "closingDocument": "臺北地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.08",
    "closedDateJudgmentRaw": "",
    "person": "陳俊維",
    "cause": "過失致死",
    "caseNumberRaw": "113偵40957",
    "closingDocument": "新北地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.15",
    "closedDateJudgmentRaw": "",
    "person": "何達仲",
    "cause": "詐欺等",
    "caseNumberRaw": "113偵21914\n114偵3480",
    "closingDocument": "士林地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.16",
    "closedDateJudgmentRaw": "",
    "person": "蘇韓碤",
    "cause": "詐欺等",
    "caseNumberRaw": "114偵2067",
    "closingDocument": "基隆地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.17",
    "closedDateJudgmentRaw": "",
    "person": "劉子隆",
    "cause": "銀行法等",
    "caseNumberRaw": "113金訴78",
    "closingDocument": "新北地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.17",
    "closedDateJudgmentRaw": "",
    "person": "蕭士島",
    "cause": "過失傷害",
    "caseNumberRaw": "114偵31890",
    "closingDocument": "臺中地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.07.30",
    "closedDateJudgmentRaw": "",
    "person": "林安樺",
    "cause": "違反洗錢防制法",
    "caseNumberRaw": "113金訴490",
    "closingDocument": "雲林地院刑事判決",
    "note": "義務案件，不報事務所案件"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.05",
    "closedDateJudgmentRaw": "",
    "person": "李欣泰",
    "cause": "詐欺等",
    "caseNumberRaw": "113金訴4486",
    "closingDocument": "臺中地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.05",
    "closedDateJudgmentRaw": "",
    "person": "陳志峯",
    "cause": "過失傷害",
    "caseNumberRaw": "113偵25337",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.06",
    "closedDateJudgmentRaw": "",
    "person": "馮翠芬",
    "cause": "違反銀行法",
    "caseNumberRaw": "114台上1321",
    "closingDocument": "最高法院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.15",
    "closedDateJudgmentRaw": "",
    "person": "吳宜達",
    "cause": "妨害自由",
    "caseNumberRaw": "113偵4839",
    "closingDocument": "士林地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "",
    "person": "",
    "cause": "傷害",
    "caseNumberRaw": "",
    "closingDocument": "士林地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.19",
    "closedDateJudgmentRaw": "",
    "person": "",
    "cause": "妨害自由等",
    "caseNumberRaw": "113偵6748",
    "closingDocument": "士林地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.22\n114.09.19(同案)",
    "closedDateJudgmentRaw": "",
    "person": "戴志純",
    "cause": "過失致死",
    "caseNumberRaw": "114重附民31",
    "closingDocument": "宜蘭地院和解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "",
    "person": "",
    "cause": "",
    "caseNumberRaw": "114交訴48",
    "closingDocument": "宜蘭地院宣示判決筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.08.29",
    "closedDateJudgmentRaw": "",
    "person": "喂藥案",
    "cause": "毒品危害防制條例等",
    "caseNumberRaw": "112偵續412、413",
    "closingDocument": "新北地檢不起訴處分書",
    "note": "義務案件，不報事務所案件\n\n對造：彭瑞君、趙珮欣、鍾侑倫、何怡君、徐睿彣、劉佳怡、林哲宇、王小蜜、洪敏珊"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.09.04",
    "closedDateJudgmentRaw": "",
    "person": "林軒如",
    "cause": "銀行法等",
    "caseNumberRaw": "113偵32530、\n113偵26280、\n113偵39248",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.09.19",
    "closedDateJudgmentRaw": "",
    "person": "呂慶林",
    "cause": "預為抵押權登記",
    "caseNumberRaw": "原114上309",
    "closingDocument": "最高法院民事裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.10.15",
    "closedDateJudgmentRaw": "",
    "person": "廖芬蘭",
    "cause": "監護宣告",
    "caseNumberRaw": "114監宣419",
    "closingDocument": "桃園地院民事裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.10.20",
    "closedDateJudgmentRaw": "",
    "person": "李志鴻、李玉",
    "cause": "拆屋還地",
    "caseNumberRaw": "114宜簡173",
    "closingDocument": "宜蘭地院簡易民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.10.20",
    "closedDateJudgmentRaw": "",
    "person": "詹智鈞",
    "cause": "確認僱傭關係存在",
    "caseNumberRaw": "113台上1235",
    "closingDocument": "最高法院民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.10.22",
    "closedDateJudgmentRaw": "",
    "person": "林明德",
    "cause": "組織犯罪防治條例等",
    "caseNumberRaw": "114少連偵47\n113偵35914",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.10.28",
    "closedDateJudgmentRaw": "",
    "person": "蘇芯菲",
    "cause": "詐欺等",
    "caseNumberRaw": "114偵5471、\n114偵6687",
    "closingDocument": "基隆地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.11.18",
    "closedDateJudgmentRaw": "",
    "person": "馮翠芬",
    "cause": "侵權行為損害賠償",
    "caseNumberRaw": "114金訴易23",
    "closingDocument": "高等法院民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.11.19",
    "closedDateJudgmentRaw": "",
    "person": "吳宗翰",
    "cause": "公共危險等",
    "caseNumberRaw": "114調偵1654",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.11.20",
    "closedDateJudgmentRaw": "",
    "person": "李欣泰",
    "cause": "槍砲彈藥刀械管制條例等",
    "caseNumberRaw": "114上訴4538",
    "closingDocument": "高等法院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.11.28",
    "closedDateJudgmentRaw": "",
    "person": "王寶萱",
    "cause": "妨害名譽等",
    "caseNumberRaw": "114偵2433",
    "closingDocument": "士林地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.12.02",
    "closedDateJudgmentRaw": "",
    "person": "李欣泰",
    "cause": "詐欺等",
    "caseNumberRaw": "114偵40065、\n114偵40066\n114偵40067",
    "closingDocument": "新北地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.12.18",
    "closedDateJudgmentRaw": "",
    "person": "林長節",
    "cause": "過失傷害",
    "caseNumberRaw": "114偵5654",
    "closingDocument": "基隆地檢起訴書",
    "note": "未掛委任就結案，不報結"
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "114.12.19",
    "closedDateJudgmentRaw": "",
    "person": "何達仲",
    "cause": "詐欺",
    "caseNumberRaw": "113偵4876",
    "closingDocument": "花蓮地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.07",
    "closedDateJudgmentRaw": "",
    "person": "游松崑",
    "cause": "妨害性自主",
    "caseNumberRaw": "114偵14061",
    "closingDocument": "屏東地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.13",
    "closedDateJudgmentRaw": "",
    "person": "許雅晶",
    "cause": "家暴防治法",
    "caseNumberRaw": "114偵10153",
    "closingDocument": "基隆地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.20",
    "closedDateJudgmentRaw": "",
    "person": "李信燕",
    "cause": "背信",
    "caseNumberRaw": "114調院偵3445",
    "closingDocument": "桃園地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.20",
    "closedDateJudgmentRaw": "",
    "person": "魏金戈",
    "cause": "過失傷害",
    "caseNumberRaw": "114審交易531",
    "closingDocument": "臺北地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.21",
    "closedDateJudgmentRaw": "",
    "person": "屏基工會(參加人)",
    "cause": "不當勞動行為爭議",
    "caseNumberRaw": "111訴1472",
    "closingDocument": "北高行判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.29",
    "closedDateJudgmentRaw": "",
    "person": "林志威",
    "cause": "拆屋還地",
    "caseNumberRaw": "114訴521",
    "closingDocument": "基隆地院民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.01.29",
    "closedDateJudgmentRaw": "",
    "person": "王靖元、廖韋萲",
    "cause": "公共危險等",
    "caseNumberRaw": "114偵56032",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.02.09",
    "closedDateJudgmentRaw": "",
    "person": "王彥中",
    "cause": "過失致死",
    "caseNumberRaw": "114調院偵4149",
    "closingDocument": "桃園地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.02.11",
    "closedDateJudgmentRaw": "",
    "person": "桃園市空服員職業工會",
    "cause": "給付薪資差額等",
    "caseNumberRaw": "114勞上152",
    "closingDocument": "高等法院和解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.02.12",
    "closedDateJudgmentRaw": "",
    "person": "蘇韓碤",
    "cause": "侵權行為損害賠償",
    "caseNumberRaw": "115移調3",
    "closingDocument": "基隆地院和解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.02.23",
    "closedDateJudgmentRaw": "",
    "person": "劉佩珏",
    "cause": "職災補償等",
    "caseNumberRaw": "115勞移調12",
    "closingDocument": "士林地院調解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.02.25",
    "closedDateJudgmentRaw": "115.01.30",
    "person": "梁語恩",
    "cause": "通常保護令",
    "caseNumberRaw": "114家護抗230",
    "closingDocument": "新北地院民事裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.03.02",
    "closedDateJudgmentRaw": "115.02.12",
    "person": "陳俊維",
    "cause": "過失致死",
    "caseNumberRaw": "115交簡135",
    "closingDocument": "新北地院刑事簡易判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.03.03",
    "closedDateJudgmentRaw": "115.02.13",
    "person": "林安樺",
    "cause": "詐欺等",
    "caseNumberRaw": "114金訴1957",
    "closingDocument": "新北地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.01",
    "person": "大於生醫",
    "cause": "侵佔",
    "caseNumberRaw": "114偵6379",
    "closingDocument": "臺北地檢起訴書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "115.03.24",
    "closedDateJudgmentRaw": "115.03.12",
    "person": "錦達事業",
    "cause": "發展觀光條例",
    "caseNumberRaw": "114上379",
    "closingDocument": "最高行政法院裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.19",
    "person": "林長節",
    "cause": "損害賠償",
    "caseNumberRaw": "115交附民移調25",
    "closingDocument": "基隆地院調解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.01",
    "person": "廖松柏",
    "cause": "過失傷害",
    "caseNumberRaw": "114偵44715",
    "closingDocument": "臺中地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.02",
    "person": "李欣泰",
    "cause": "槍砲彈藥刀械管制條例等",
    "caseNumberRaw": "115台上652",
    "closingDocument": "最高法院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.08",
    "person": "詹智鈞",
    "cause": "確認僱傭關係存在",
    "caseNumberRaw": "115勞上移調4",
    "closingDocument": "高等法院高雄分院調解筆錄",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.10",
    "person": "竹南鎮公所企業工會",
    "cause": "不當勞動行為裁決",
    "caseNumberRaw": "114勞裁15",
    "closingDocument": "勞動部裁決決定書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.14",
    "person": "許雅晶",
    "cause": "家暴妨害性自主",
    "caseNumberRaw": "114侵訴88",
    "closingDocument": "桃園地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.09",
    "person": "蔡鄭香菊",
    "cause": "過失傷害",
    "caseNumberRaw": "114偵25194\n115調偵緝72",
    "closingDocument": "臺北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.04.29",
    "person": "劉春、謝慕真",
    "cause": "給付清潔費",
    "caseNumberRaw": "115基小355",
    "closingDocument": "基隆地院基隆簡易庭小額民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.05.08",
    "person": "許雅晶",
    "cause": "返還代墊未成年子女扶養費",
    "caseNumberRaw": "115家親聲91",
    "closingDocument": "桃園地院民事裁定",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.05.08",
    "person": "許雅晶",
    "cause": "離婚等",
    "caseNumberRaw": "115婚59",
    "closingDocument": "桃園地院民事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.05.18",
    "person": "林長節",
    "cause": "過失傷害",
    "caseNumberRaw": "114交易217",
    "closingDocument": "基隆地院刑事判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.05.26",
    "person": "曾春霞",
    "cause": "偽造文書",
    "caseNumberRaw": "114基簡832",
    "closingDocument": "基隆地院刑事簡易判決",
    "note": ""
  },
  {
    "attorney": "陳律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.05.26",
    "person": "王寶萱",
    "cause": "侵權行為損害賠償",
    "caseNumberRaw": "114上1026",
    "closingDocument": "高等法院民事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "(無資料)",
    "closedDateJudgmentRaw": "",
    "person": "經濟部大園產業園區服務中心",
    "cause": "產業創新條例",
    "caseNumberRaw": "113訴1358",
    "closingDocument": "(無資料)",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.03.20",
    "closedDateJudgmentRaw": "",
    "person": "張一為",
    "cause": "損害賠償",
    "caseNumberRaw": "113重勞訴40",
    "closingDocument": "臺北地院民事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.03.27",
    "closedDateJudgmentRaw": "",
    "person": "耐斯生醫股份有限公司等",
    "cause": "侵害商標權有關\n財產權爭議等",
    "caseNumberRaw": "113民商訴41",
    "closingDocument": "智財法院調解筆錄",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.04.02",
    "closedDateJudgmentRaw": "",
    "person": "鍾瑛縈",
    "cause": "妨害自由",
    "caseNumberRaw": "113上易960",
    "closingDocument": "高等法院刑事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.04.09",
    "closedDateJudgmentRaw": "",
    "person": "鍾瑛縈",
    "cause": "背信等",
    "caseNumberRaw": "111偵續544",
    "closingDocument": "臺北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.04.15",
    "closedDateJudgmentRaw": "",
    "person": "陳煜勛",
    "cause": "給付退休金",
    "caseNumberRaw": "114勞專調18",
    "closingDocument": "桃園地院調解筆錄",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.05.29",
    "closedDateJudgmentRaw": "",
    "person": "柯淑惠等",
    "cause": "請求撤銷股東會決議",
    "caseNumberRaw": "114台上325",
    "closingDocument": "最高法院刑事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.07.18",
    "closedDateJudgmentRaw": "",
    "person": "曾明德等",
    "cause": "所有權轉移登記",
    "caseNumberRaw": "113重上更一139",
    "closingDocument": "高等法院民事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.09.10\n114.10.03(同案)",
    "closedDateJudgmentRaw": "",
    "person": "吳明達",
    "cause": "損害賠償",
    "caseNumberRaw": "114屏偵移調147\n113偵3509",
    "closingDocument": "屏東地院調解筆錄\n屏東地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.09.22",
    "closedDateJudgmentRaw": "",
    "person": "果思設計",
    "cause": "反還價金等",
    "caseNumberRaw": "113重上657",
    "closingDocument": "高等法院調解筆錄",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.10.15",
    "closedDateJudgmentRaw": "",
    "person": "柯淑惠等",
    "cause": "背信",
    "caseNumberRaw": "114上易1480",
    "closingDocument": "高等法院刑事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.11.10",
    "closedDateJudgmentRaw": "",
    "person": "曾明德等",
    "cause": "所有權轉移登記",
    "caseNumberRaw": "114台上1885",
    "closingDocument": "最高法院民事裁定",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.11.26",
    "closedDateJudgmentRaw": "",
    "person": "元宸營造",
    "cause": "支付命令",
    "caseNumberRaw": "114司促31462",
    "closingDocument": "新北地院支付命令",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "114.12.11",
    "closedDateJudgmentRaw": "",
    "person": "蔡勝美",
    "cause": "返還土地",
    "caseNumberRaw": "114北司調938",
    "closingDocument": "臺北地院調解筆錄",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "115.02.05",
    "closedDateJudgmentRaw": "",
    "person": "新宏興營造",
    "cause": "請求給付保險金等",
    "caseNumberRaw": "114保險18",
    "closingDocument": "高雄地院民事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.12",
    "person": "陳詩惠",
    "cause": "侵權行為損害賠償",
    "caseNumberRaw": "114重簡2272",
    "closingDocument": "新北地院民事判決",
    "note": ""
  },
  {
    "attorney": "林律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.23",
    "person": "石修鳴",
    "cause": "通常保護令",
    "caseNumberRaw": "115家護324",
    "closingDocument": "新北地院通常保護令",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.03.07",
    "closedDateJudgmentRaw": "",
    "person": "陳妍宇",
    "cause": "請求確認本票債權不存在等",
    "caseNumberRaw": "111訴240",
    "closingDocument": "士林地院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.03.14",
    "closedDateJudgmentRaw": "",
    "person": "周佳惠",
    "cause": "請求不動產所有權轉移登記",
    "caseNumberRaw": "112訴376",
    "closingDocument": "新北地院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.03.26",
    "closedDateJudgmentRaw": "",
    "person": "永好企業",
    "cause": "債務人異議之訴",
    "caseNumberRaw": "113上1100",
    "closingDocument": "高等法院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.04.08",
    "closedDateJudgmentRaw": "",
    "person": "廖姵婕",
    "cause": "過失傷害",
    "caseNumberRaw": "112北檢4498",
    "closingDocument": "臺北地院簡易民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.04.15",
    "closedDateJudgmentRaw": "",
    "person": "方麥弗",
    "cause": "偽造文書",
    "caseNumberRaw": "113偵續443",
    "closingDocument": "臺北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.06.04",
    "closedDateJudgmentRaw": "",
    "person": "周佳惠、盧韻如",
    "cause": "分割共有物",
    "caseNumberRaw": "113訴1437",
    "closingDocument": "新北地院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.06.06",
    "closedDateJudgmentRaw": "",
    "person": "方麥弗",
    "cause": "偽造文書",
    "caseNumberRaw": "114上聲議3969",
    "closingDocument": "高檢處分書",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.06.11",
    "closedDateJudgmentRaw": "",
    "person": "張淑琴等",
    "cause": "過失致死",
    "caseNumberRaw": "113續偵一2",
    "closingDocument": "臺北地檢起訴書",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.07.14",
    "closedDateJudgmentRaw": "",
    "person": "張賴秀英等",
    "cause": "確定界址",
    "caseNumberRaw": "113簡上79",
    "closingDocument": "臺北地院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.07.28",
    "closedDateJudgmentRaw": "",
    "person": "賴韶廣",
    "cause": "請求清算合夥事業等",
    "caseNumberRaw": "113上487",
    "closingDocument": "臺中高分院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.07.29",
    "closedDateJudgmentRaw": "",
    "person": "陳姵蓁、蔡政哲",
    "cause": "不動產所有權轉移登記",
    "caseNumberRaw": "113訴2862",
    "closingDocument": "新北地院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.09.04",
    "closedDateJudgmentRaw": "",
    "person": "蕭光雄",
    "cause": "請求撤銷贈予行為等",
    "caseNumberRaw": "113重訴1019",
    "closingDocument": "臺北地院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.10.15",
    "closedDateJudgmentRaw": "",
    "person": "張秦纁",
    "cause": "確認抵押權不存在等",
    "caseNumberRaw": "113上406",
    "closingDocument": "臺中高分院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.10.20",
    "closedDateJudgmentRaw": "",
    "person": "永好企業",
    "cause": "給付違約金",
    "caseNumberRaw": "113北簡8186",
    "closingDocument": "臺北地院簡易民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.11.17",
    "closedDateJudgmentRaw": "",
    "person": "蕭士島",
    "cause": "過失傷害",
    "caseNumberRaw": "114偵續290",
    "closingDocument": "臺中地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "114.12.23",
    "closedDateJudgmentRaw": "",
    "person": "劉幼蘭",
    "cause": "分割遺產調解",
    "caseNumberRaw": "114家調1394",
    "closingDocument": "新北地院調解不成立證明書",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "115.02.03",
    "closedDateJudgmentRaw": "",
    "person": "簡佳誼",
    "cause": "損害賠償",
    "caseNumberRaw": "114士簡1399",
    "closingDocument": "士林地院民事簡易判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.04",
    "person": "賴韶廣",
    "cause": "清算合夥事業等",
    "caseNumberRaw": "114台上2159",
    "closingDocument": "最高法院民事裁定",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.10",
    "person": "林政穎",
    "cause": "詐欺",
    "caseNumberRaw": "114偵63519、\n115偵8219、\n115偵13688",
    "closingDocument": "新北地檢起訴書、新北地檢不起訴處分書",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.03.18",
    "person": "方麥弗",
    "cause": "許可執行外國法院確定判決",
    "caseNumberRaw": "114台上707",
    "closingDocument": "最高法院民事判決",
    "note": ""
  },
  {
    "attorney": "王律師",
    "closedDateRaw": "",
    "closedDateJudgmentRaw": "115.05.08",
    "person": "二本松有限公司",
    "cause": "確認僱傭關係存在等",
    "caseNumberRaw": "114勞訴253",
    "closingDocument": "臺北地院民事判決",
    "note": ""
  },
  {
    "attorney": "程律師",
    "closedDateRaw": "114.06.18",
    "closedDateJudgmentRaw": "",
    "person": "林錦毅",
    "cause": "侵佔等",
    "caseNumberRaw": "114偵3597",
    "closingDocument": "新北地檢不起訴處分書",
    "note": ""
  }
]
