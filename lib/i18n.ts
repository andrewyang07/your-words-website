// 国际化文本配置
import { Language } from '@/types/verse';

interface Translations {
    // 通用
    loading: string;
    error: string;
    retry: string;
    close: string;
    cancel: string;
    confirm: string;
    
    // 导航和菜单
    menu: string;
    help: string;
    backToCards: string;
    backHome: string;
    goBack: string;
    notebook: string;
    about: string;
    helpPage: string;
    
    // 模式切换
    readMode: string;
    reciteMode: string;
    switchToRead: string;
    switchToRecite: string;
    
    // 书卷和章节
    selectBook: string;
    selectChapter: string;
    chapter: string;
    prevChapter: string;
    nextChapter: string;
    viewWholeChapter: string;
    oldTestament: string;
    newTestament: string;
    
    // 卡片操作
    shuffle: string;
    favorites: string;
    share: string;
    addToFavorites: string;
    removeFromFavorites: string;
    
    // 遮罩设置
    maskSettings: string;
    maskMode: string;
    perSentenceHint: string;
    beginningHint: string;
    charCountType: string;
    fixedCount: string;
    randomRange: string;
    minChars: string;
    maxChars: string;
    chars: string;
    showBeforePunctuation: string;
    resetToDefault: string;
    
    // 收藏和分享
    myFavorites: string;
    shareLink: string;
    shareDescription: string;
    copySuccess: string;
    copyFailed: string;
    addAllSuccess: string;
    noFavorites: string;
    noFavoritesHint: string;
    
    // 筆記本
    noteTitle: string;
    noteBeta: string;
    noteEditor: string;
    notePreview: string;
    noteReferences: string;
    noteExpandAll: string;
    noteExport: string;
    noteCopyToClipboard: string;
    noteDownloadMd: string;
    noteOpenBible: string;
    notePlaceholder: string;
    noteAllExpanded: string;
    noteInsert: string;
    noteSelect: string;
    noteMultiSelect: string;
    
    // 帮助和引导
    helpGuideTitle: string;
    helpGuideClose: string;
    guideClosed: string;
    
    // 其他
    total: string;
    verses: string;
    selected: string;
    searching: string;
}

export const translations: Record<Language, Translations> = {
    traditional: {
        // 通用
        loading: '載入中...',
        error: '錯誤',
        retry: '重試',
        close: '關閉',
        cancel: '取消',
        confirm: '確認',
        
        // 导航和菜单
        menu: '菜單',
        help: '幫助',
        backToCards: '返回卡片',
        backHome: '返回主頁',
        goBack: '返回',
        notebook: '筆記本',
        about: '關於',
        helpPage: '幫助',
        
        // 模式切换
        readMode: '閱讀',
        reciteMode: '背誦',
        switchToRead: '切換到閱讀模式',
        switchToRecite: '切換到背誦模式',
        
        // 书卷和章节
        selectBook: '選擇書卷',
        selectChapter: '選擇章節',
        chapter: '章',
        prevChapter: '上一章',
        nextChapter: '下一章',
        viewWholeChapter: '查看整章',
        oldTestament: '舊約',
        newTestament: '新約',
        
        // 卡片操作
        shuffle: '隨機',
        favorites: '收藏',
        share: '分享',
        addToFavorites: '加入收藏',
        removeFromFavorites: '取消收藏',
        
        // 遮罩设置
        maskSettings: '遮罩設置',
        maskMode: '提示模式',
        perSentenceHint: '每句提示',
        beginningHint: '開頭提示',
        charCountType: '字數設置',
        fixedCount: '固定字數',
        randomRange: '隨機字數',
        minChars: '最少:',
        maxChars: '最多:',
        chars: '字',
        showBeforePunctuation: '標點前顯示',
        resetToDefault: '恢復默認',
        
        // 收藏和分享
        myFavorites: '我的收藏',
        shareLink: '分享鏈接',
        shareDescription: '將此鏈接分享給朋友，他們可以直接看到這些經文並一鍵收藏',
        copySuccess: '已複製到剪貼板！',
        copyFailed: '複製失敗',
        addAllSuccess: '已將所有經文加入收藏！',
        noFavorites: '還沒有收藏的經文',
        noFavoritesHint: '點擊經文卡片上的星標圖標即可收藏',
        
        // 筆記本
        noteTitle: '你的話語',
        noteBeta: 'BETA',
        noteEditor: '編輯',
        notePreview: '預覽',
        noteReferences: '引用的經文',
        noteExpandAll: '展開所有經文',
        noteExport: '導出',
        noteCopyToClipboard: '複製到剪貼板',
        noteDownloadMd: '下載 MD 文件',
        noteOpenBible: '打開聖經',
        notePlaceholder: '開始記錄你的靈修筆記...\n\n試試輸入經文引用，如「馬太福音5:1」，系統會自動顯示補全建議。',
        noteAllExpanded: '所有經文已展開！',
        noteInsert: '插入',
        noteSelect: '選擇經文',
        noteMultiSelect: '已選擇',
        
        // 帮助和引导
        helpGuideTitle: '如何使用',
        helpGuideClose: '知道了',
        guideClosed: '引導已關閉。如需再次查看，請點擊右上角的「幫助」按鈕',
        
        // 其他
        total: '共',
        verses: '節',
        selected: '已選',
        searching: '搜尋中...',
    },
    
    simplified: {
        // 通用
        loading: '加载中...',
        error: '错误',
        retry: '重试',
        close: '关闭',
        cancel: '取消',
        confirm: '确认',
        
        // 导航和菜单
        menu: '菜单',
        help: '帮助',
        backToCards: '返回卡片',
        backHome: '返回主页',
        goBack: '返回',
        notebook: '笔记本',
        about: '关于',
        helpPage: '帮助',
        
        // 模式切换
        readMode: '阅读',
        reciteMode: '背诵',
        switchToRead: '切换到阅读模式',
        switchToRecite: '切换到背诵模式',
        
        // 书卷和章节
        selectBook: '选择书卷',
        selectChapter: '选择章节',
        chapter: '章',
        prevChapter: '上一章',
        nextChapter: '下一章',
        viewWholeChapter: '查看整章',
        oldTestament: '旧约',
        newTestament: '新约',
        
        // 卡片操作
        shuffle: '随机',
        favorites: '收藏',
        share: '分享',
        addToFavorites: '加入收藏',
        removeFromFavorites: '取消收藏',
        
        // 遮罩设置
        maskSettings: '遮罩设置',
        maskMode: '提示模式',
        perSentenceHint: '每句提示',
        beginningHint: '开头提示',
        charCountType: '字数设置',
        fixedCount: '固定字数',
        randomRange: '随机字数',
        minChars: '最少:',
        maxChars: '最多:',
        chars: '字',
        showBeforePunctuation: '标点前显示',
        resetToDefault: '恢复默认',
        
        // 收藏和分享
        myFavorites: '我的收藏',
        shareLink: '分享链接',
        shareDescription: '将此链接分享给朋友，他们可以直接看到这些经文并一键收藏',
        copySuccess: '已复制到剪贴板！',
        copyFailed: '复制失败',
        addAllSuccess: '已将所有经文加入收藏！',
        noFavorites: '还没有收藏的经文',
        noFavoritesHint: '点击经文卡片上的星标图标即可收藏',
        
        // 笔记本
        noteTitle: '你的话语',
        noteBeta: 'BETA',
        noteEditor: '编辑',
        notePreview: '预览',
        noteReferences: '引用的经文',
        noteExpandAll: '展开所有经文',
        noteExport: '导出',
        noteCopyToClipboard: '复制到剪贴板',
        noteDownloadMd: '下载 MD 文件',
        noteOpenBible: '打开圣经',
        notePlaceholder: '开始记录你的灵修笔记...\n\n试试输入经文引用，如「马太福音5:1」，系统会自动显示补全建议。',
        noteAllExpanded: '所有经文已展开！',
        noteInsert: '插入',
        noteSelect: '选择经文',
        noteMultiSelect: '已选择',
        
        // 帮助和引导
        helpGuideTitle: '如何使用',
        helpGuideClose: '知道了',
        guideClosed: '引导已关闭。如需再次查看，请点击右上角的「帮助」按钮',
        
        // 其他
        total: '共',
        verses: '节',
        selected: '已选',
        searching: '搜索中...',
    },
    
    english: {
        // 通用
        loading: 'Loading...',
        error: 'Error',
        retry: 'Retry',
        close: 'Close',
        cancel: 'Cancel',
        confirm: 'Confirm',
        
        // 导航和菜单
        menu: 'Menu',
        help: 'Help',
        backToCards: 'Back to Cards',
        backHome: 'Back Home',
        goBack: 'Back',
        notebook: 'Notebook',
        about: 'About',
        helpPage: 'Help',
        
        // 模式切换
        readMode: 'Read',
        reciteMode: 'Recite',
        switchToRead: 'Switch to Read Mode',
        switchToRecite: 'Switch to Recite Mode',
        
        // 书卷和章节
        selectBook: 'Select Book',
        selectChapter: 'Select Chapter',
        chapter: 'Ch.',
        prevChapter: 'Previous',
        nextChapter: 'Next',
        viewWholeChapter: 'View Chapter',
        oldTestament: 'Old Testament',
        newTestament: 'New Testament',
        
        // 卡片操作
        shuffle: 'Shuffle',
        favorites: 'Favorites',
        share: 'Share',
        addToFavorites: 'Add to Favorites',
        removeFromFavorites: 'Remove from Favorites',
        
        // 遮罩设置
        maskSettings: 'Mask Settings',
        maskMode: 'Hint Mode',
        perSentenceHint: 'Per Sentence',
        beginningHint: 'Beginning Only',
        charCountType: 'Word Count',
        fixedCount: 'Fixed',
        randomRange: 'Random',
        minChars: 'Min:',
        maxChars: 'Max:',
        chars: 'words',
        showBeforePunctuation: 'Before Punctuation',
        resetToDefault: 'Reset to Default',
        
        // 收藏和分享
        myFavorites: 'My Favorites',
        shareLink: 'Share Link',
        shareDescription: 'Share this link with friends. They can view these verses and add them to favorites with one click',
        copySuccess: 'Copied to clipboard!',
        copyFailed: 'Copy failed',
        addAllSuccess: 'All verses added to favorites!',
        noFavorites: 'No favorite verses yet',
        noFavoritesHint: 'Click the star icon on verse cards to add favorites',
        
        // 笔记本
        noteTitle: 'Your Words',
        noteBeta: 'BETA',
        noteEditor: 'Edit',
        notePreview: 'Preview',
        noteReferences: 'Referenced Verses',
        noteExpandAll: 'Expand All Verses',
        noteExport: 'Export',
        noteCopyToClipboard: 'Copy to Clipboard',
        noteDownloadMd: 'Download as MD',
        noteOpenBible: 'Open Bible',
        notePlaceholder: 'Start writing your devotional notes...\n\nTry typing a verse reference like "John 3:16" for auto-completion.',
        noteAllExpanded: 'All verses expanded!',
        noteInsert: 'Insert',
        noteSelect: 'Select Verses',
        noteMultiSelect: 'Selected',
        
        // 帮助和引导
        helpGuideTitle: 'How to Use',
        helpGuideClose: 'Got it',
        guideClosed: 'Guide closed. Click the "Help" button in the top right to view again',
        
        // 其他
        total: 'Total',
        verses: 'verses',
        selected: 'selected',
        searching: 'Searching...',
    },
};

// 获取当前语言的翻译
export function t(key: keyof Translations, language: Language = 'traditional'): string {
    return translations[language][key];
}

// 导出 translations 供直接使用
export default translations;

