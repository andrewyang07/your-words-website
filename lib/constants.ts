// 应用常量定义

// 100节精选经文引用 (基于 Kendra Fletcher 清单)
export const PRESET_VERSE_REFERENCES = [
  // 创世记
  { book: '创世记', chapter: 1, verse: 1, priority: 5 },
  
  // 利未记
  { book: '利未记', chapter: 19, verse: 11, priority: 3 },
  
  // 民数记
  { book: '民数记', chapter: 23, verse: 19, priority: 3 },
  
  // 约书亚记
  { book: '约书亚记', chapter: 1, verse: 8, priority: 4 },
  
  // 诗篇
  { book: '诗篇', chapter: 23, verse: 1, priority: 5 },
  { book: '诗篇', chapter: 23, verse: 2, priority: 5 },
  { book: '诗篇', chapter: 23, verse: 3, priority: 5 },
  { book: '诗篇', chapter: 23, verse: 4, priority: 5 },
  { book: '诗篇', chapter: 23, verse: 5, priority: 5 },
  { book: '诗篇', chapter: 23, verse: 6, priority: 5 },
  { book: '诗篇', chapter: 56, verse: 3, priority: 4 },
  { book: '诗篇', chapter: 96, verse: 2, priority: 3 },
  { book: '诗篇', chapter: 100, verse: 1, priority: 4 },
  { book: '诗篇', chapter: 100, verse: 2, priority: 4 },
  { book: '诗篇', chapter: 100, verse: 3, priority: 4 },
  { book: '诗篇', chapter: 100, verse: 4, priority: 4 },
  { book: '诗篇', chapter: 100, verse: 5, priority: 4 },
  { book: '诗篇', chapter: 119, verse: 9, priority: 4 },
  { book: '诗篇', chapter: 119, verse: 11, priority: 5 },
  { book: '诗篇', chapter: 147, verse: 5, priority: 3 },
  
  // 箴言
  { book: '箴言', chapter: 3, verse: 5, priority: 5 },
  { book: '箴言', chapter: 3, verse: 6, priority: 5 },
  { book: '箴言', chapter: 3, verse: 9, priority: 4 },
  { book: '箴言', chapter: 3, verse: 10, priority: 4 },
  
  // 以赛亚书
  { book: '以赛亚书', chapter: 26, verse: 3, priority: 4 },
  { book: '以赛亚书', chapter: 40, verse: 31, priority: 5 },
  { book: '以赛亚书', chapter: 41, verse: 10, priority: 5 },
  { book: '以赛亚书', chapter: 53, verse: 6, priority: 5 },
  
  // 耶利米书
  { book: '耶利米书', chapter: 29, verse: 11, priority: 5 },
  
  // 耶利米哀歌
  { book: '耶利米哀歌', chapter: 3, verse: 22, priority: 4 },
  { book: '耶利米哀歌', chapter: 3, verse: 23, priority: 4 },
  
  // 马太福音
  { book: '马太福音', chapter: 1, verse: 21, priority: 4 },
  { book: '马太福音', chapter: 4, verse: 19, priority: 4 },
  { book: '马太福音', chapter: 5, verse: 16, priority: 4 },
  { book: '马太福音', chapter: 6, verse: 33, priority: 5 },
  { book: '马太福音', chapter: 11, verse: 28, priority: 5 },
  { book: '马太福音', chapter: 28, verse: 19, priority: 5 },
  { book: '马太福音', chapter: 28, verse: 20, priority: 5 },
  
  // 马可福音
  { book: '马可福音', chapter: 10, verse: 45, priority: 4 },
  { book: '马可福音', chapter: 12, verse: 30, priority: 5 },
  { book: '马可福音', chapter: 12, verse: 31, priority: 5 },
  
  // 路加福音
  { book: '路加福音', chapter: 2, verse: 10, priority: 5 },
  { book: '路加福音', chapter: 2, verse: 11, priority: 5 },
  { book: '路加福音', chapter: 6, verse: 31, priority: 4 },
  { book: '路加福音', chapter: 9, verse: 23, priority: 4 },
  { book: '路加福音', chapter: 19, verse: 10, priority: 4 },
  
  // 约翰福音
  { book: '约翰福音', chapter: 1, verse: 1, priority: 5 },
  { book: '约翰福音', chapter: 1, verse: 12, priority: 5 },
  { book: '约翰福音', chapter: 3, verse: 16, priority: 5 },
  { book: '约翰福音', chapter: 3, verse: 17, priority: 5 },
  { book: '约翰福音', chapter: 8, verse: 12, priority: 4 },
  { book: '约翰福音', chapter: 10, verse: 10, priority: 4 },
  { book: '约翰福音', chapter: 11, verse: 25, priority: 5 },
  { book: '约翰福音', chapter: 13, verse: 34, priority: 4 },
  { book: '约翰福音', chapter: 14, verse: 6, priority: 5 },
  { book: '约翰福音', chapter: 15, verse: 5, priority: 4 },
  
  // 使徒行传
  { book: '使徒行传', chapter: 1, verse: 8, priority: 4 },
  { book: '使徒行传', chapter: 4, verse: 12, priority: 5 },
  { book: '使徒行传', chapter: 16, verse: 31, priority: 5 },
  
  // 罗马书
  { book: '罗马书', chapter: 1, verse: 16, priority: 5 },
  { book: '罗马书', chapter: 3, verse: 23, priority: 5 },
  { book: '罗马书', chapter: 5, verse: 8, priority: 5 },
  { book: '罗马书', chapter: 6, verse: 23, priority: 5 },
  { book: '罗马书', chapter: 8, verse: 1, priority: 5 },
  { book: '罗马书', chapter: 8, verse: 28, priority: 5 },
  { book: '罗马书', chapter: 10, verse: 9, priority: 5 },
  { book: '罗马书', chapter: 10, verse: 13, priority: 5 },
  { book: '罗马书', chapter: 12, verse: 1, priority: 4 },
  { book: '罗马书', chapter: 12, verse: 2, priority: 4 },
  
  // 哥林多前书
  { book: '哥林多前书', chapter: 10, verse: 13, priority: 4 },
  { book: '哥林多前书', chapter: 13, verse: 4, priority: 4 },
  { book: '哥林多前书', chapter: 13, verse: 5, priority: 4 },
  { book: '哥林多前书', chapter: 13, verse: 6, priority: 4 },
  { book: '哥林多前书', chapter: 13, verse: 7, priority: 4 },
  { book: '哥林多前书', chapter: 13, verse: 8, priority: 4 },
  { book: '哥林多前书', chapter: 15, verse: 3, priority: 5 },
  { book: '哥林多前书', chapter: 15, verse: 4, priority: 5 },
  
  // 哥林多后书
  { book: '哥林多后书', chapter: 5, verse: 17, priority: 5 },
  { book: '哥林多后书', chapter: 5, verse: 21, priority: 5 },
  
  // 加拉太书
  { book: '加拉太书', chapter: 2, verse: 20, priority: 4 },
  { book: '加拉太书', chapter: 5, verse: 22, priority: 4 },
  { book: '加拉太书', chapter: 5, verse: 23, priority: 4 },
  
  // 以弗所书
  { book: '以弗所书', chapter: 2, verse: 8, priority: 5 },
  { book: '以弗所书', chapter: 2, verse: 9, priority: 5 },
  { book: '以弗所书', chapter: 2, verse: 10, priority: 4 },
  { book: '以弗所书', chapter: 4, verse: 32, priority: 4 },
  { book: '以弗所书', chapter: 6, verse: 1, priority: 3 },
  
  // 腓立比书
  { book: '腓立比书', chapter: 4, verse: 4, priority: 4 },
  { book: '腓立比书', chapter: 4, verse: 6, priority: 5 },
  { book: '腓立比书', chapter: 4, verse: 7, priority: 5 },
  { book: '腓立比书', chapter: 4, verse: 13, priority: 5 },
  
  // 歌罗西书
  { book: '歌罗西书', chapter: 3, verse: 2, priority: 4 },
  { book: '歌罗西书', chapter: 3, verse: 23, priority: 4 },
  
  // 帖撒罗尼迦前书
  { book: '帖撒罗尼迦前书', chapter: 5, verse: 16, priority: 4 },
  { book: '帖撒罗尼迦前书', chapter: 5, verse: 17, priority: 4 },
  { book: '帖撒罗尼迦前书', chapter: 5, verse: 18, priority: 4 },
  
  // 提摩太后书
  { book: '提摩太后书', chapter: 3, verse: 16, priority: 5 },
  
  // 希伯来书
  { book: '希伯来书', chapter: 4, verse: 12, priority: 4 },
  { book: '希伯来书', chapter: 11, verse: 1, priority: 5 },
  { book: '希伯来书', chapter: 11, verse: 6, priority: 4 },
  { book: '希伯来书', chapter: 13, verse: 5, priority: 4 },
  
  // 雅各书
  { book: '雅各书', chapter: 1, verse: 2, priority: 4 },
  { book: '雅各书', chapter: 1, verse: 3, priority: 4 },
  { book: '雅各书', chapter: 1, verse: 22, priority: 4 },
  
  // 彼得前书
  { book: '彼得前书', chapter: 2, verse: 2, priority: 3 },
  { book: '彼得前书', chapter: 3, verse: 18, priority: 4 },
  { book: '彼得前书', chapter: 5, verse: 7, priority: 5 },
  
  // 约翰一书
  { book: '约翰一书', chapter: 1, verse: 9, priority: 5 },
  { book: '约翰一书', chapter: 4, verse: 7, priority: 4 },
  { book: '约翰一书', chapter: 4, verse: 8, priority: 5 },
  { book: '约翰一书', chapter: 5, verse: 11, priority: 5 },
  { book: '约翰一书', chapter: 5, verse: 12, priority: 5 },
  { book: '约翰一书', chapter: 5, verse: 13, priority: 5 },
  
  // 启示录
  { book: '启示录', chapter: 3, verse: 20, priority: 4 },
] as const;

// 动画持续时间（毫秒）
export const ANIMATION_DURATION = {
  SHORT: 300,
  MEDIUM: 600,
  LONG: 1000,
} as const;

// 卡片尺寸映射
export const CARD_SIZES = {
  small: { width: 'w-48', height: 'min-h-[120px]', padding: 'p-4', text: 'text-sm' },
  medium: { width: 'w-56', height: 'min-h-[160px]', padding: 'p-6', text: 'text-base' },
  large: { width: 'w-64', height: 'min-h-[200px]', padding: 'p-8', text: 'text-lg' },
} as const;

