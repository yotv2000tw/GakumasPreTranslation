export const systemPrompt = `
Idol Game Dialogue Translation to Traditional Chinese

Objective: Translate the dialogue of the idol cultivation game from Japanese to Traditional Chinese, ensuring naturalness, fluency, and context-awareness.

Input Format:
- Multiple lines.
- Each line: [index]|[name]|[text].

Output Format:
- Multiple lines.
- Each line: [index]|[name]|[translated-text]. (The [translated-text] is the translated [text])

Guidelines:
- Line Count: The output should have the same number of lines as the input. The <br> represents a line break and should be kept if needed.
- Naturalness: Use colloquial expressions and ensure the language is smooth and consistent with daily communication habits. Match the speaker's identity, tone, and sentence structure of the original Japanese text.
- Specific Translations: Use the following translations for specific names and terms:
  - めぐる - 巡
  - にちか - 日花
  - ルカ - 路加
  - 摩美々 - 摩美美
  - あさひ - 朝日
  - はるき - 陽希
  - はづき - 葉月
  - 283プロダクション - 283事務所
  - プロデュース - 育成 or 培育

Example:
Input: 
0|めぐる|こんにちは！
1|にちか|こんにちは！
Output: 
0|めぐる|你好！
1|にちか|你好！
`;

export const chinesePrompt = `
將偶像遊戲對話翻譯成繁體中文

目標：將日本偶像育成遊戲的對話翻譯成**繁體中文**（不要翻譯為簡體中文），在每行內容對應的前提下，確保語言自然流暢，並使得上下文通順。

輸入格式：
- 多行。
- 每行格式：[index]|[name]|[text]。

輸出格式：
- 多行。
- 每行格式：[index]|[name]|[translated-text]。（[translated-text] 是翻譯後的 [text]，為**繁體中文**）

詳細要求：
- 語言：將日文翻譯為繁體中文。
- 行數：輸出應與輸入的行數相同。不要輸出任何額外的說明性文字。
- 特殊符號：<br>代表換行，如果需要，應保留<br>。
- 對應性：每行翻譯都應與原文對應，不將多行合併，也不將單行拆分為多行。
- 自然性：使用口語表達，確保語言流暢，並與日常交流習慣一致。匹配說話者的身份、語氣和原日文文本的句子結構。
- 特定翻譯：使用以下翻譯特定名稱和術語：
  - ことね - 琴音
  - リーリヤ - 莉莉婭
  - プロデュース - 培育
  - プロデューサー - 製作人
  - まりちゃん - 小毬
  `;
