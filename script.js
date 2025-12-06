// === نظام البطاقات التفاعلية - النسخة المتطورة ===

// === Animate.css helper ===
function animateOnce(el, className, dur=800){ 
    if(!el) return; 
    el.classList.add('animated', className); 
    setTimeout(()=>{ 
        el.classList.remove('animated', className); 
    }, dur); 
}

// === نظام التهيئة ===
let isInitialized = false;
let initializationTime = null;

// === البيانات الأساسية ===
const DEFAULTS = window.DEFAULT_ITEMS || [];
let ITEMS = [];
let DATA_FILE = null;
let currentLanguage = 'ar';

// === نظام تخزين البيانات ===
function loadItems() {
    try {
        const raw = localStorage.getItem('cardsItems');
        const items = raw ? JSON.parse(raw) : null;
        
        if (items && Array.isArray(items) && items.length > 0) {
            ITEMS = items;
            return true;
        }
        
        // إذا لم توجد بيانات، نستخدم الافتراضية
        ITEMS = [...DEFAULTS];
        saveItems();
        return true;
    } catch(e) {
        console.error('خطأ في تحميل البيانات:', e);
        ITEMS = [...DEFAULTS];
        saveItems();
        return false;
    }
}

function saveItems() {
    try {
        localStorage.setItem('cardsItems', JSON.stringify(ITEMS));
        updateCardsCount();
        return true;
    } catch(e) {
        console.error('خطأ في حفظ البيانات:', e);
        showNotification('❌ خطأ في حفظ البيانات', 'error');
        return false;
    }
}

function getImgSrc(item) {
    // إذا كانت الصورة بصيغة base64
    if (item.img && item.img.startsWith('data:image')) {
        return item.img;
    }
    // إذا كان لدينا رابط خارجي
    if (item.img && (item.img.startsWith('http://') || item.img.startsWith('https://'))) {
        return item.img;
    }
    // المحاولة من مجلد assets
    return item.img || `assets/${item.id}.png`;
}

// === نظام قراءة الملفات ===
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function loadFromFile(file) {
    try {
        const content = await readFileAsText(file);
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
            ITEMS = data;
            DATA_FILE = file;
            saveItems();
            return true;
        } else {
            throw new Error('تنسيق الملف غير صالح');
        }
    } catch (error) {
        console.error('خطأ في قراءة الملف:', error);
        return false;
    }
}

// === عناصر الواجهة ===
const elements = {
    grid: document.getElementById('cardsGrid'),
    langSelect: document.getElementById('langSelect'),
    toggleNamesBtn: document.getElementById('toggleNames'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    resetBtn: document.getElementById('resetBtn'),
    homeBtn: document.getElementById('homeBtn'),
    testsBtn: document.getElementById('testsBtn'),
    cardsMode: document.getElementById('cardsMode'),
    testsHub: document.getElementById('testsHub'),
    matchMode: document.getElementById('matchMode'),
    lettersMode: document.getElementById('lettersMode'),
    goMatch: document.getElementById('goMatch'),
    goLetters: document.getElementById('goLetters'),
    goCards: document.getElementById('goCards'),
    cardsCount: document.getElementById('cardsCount'),
    totalPlays: document.getElementById('totalPlays'),
    totalWins: document.getElementById('totalWins'),
    bestScore: document.getElementById('bestScore'),
    playTime: document.getElementById('playTime')
};

// === متغيرات الحالة ===
let showNames = true;
let currentOrder = [];
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let darkMode = localStorage.getItem('darkMode') === 'true';

// === تهيئة النظام ===
function initSystem() {
    if (isInitialized) return;
    
    initializationTime = new Date();
    
    // تحميل البيانات
    loadItems();
    
    // تهيئة واجهة المستخدم
    initUI();
    
    // تحميل الإحصائيات
    loadStats();
    
    // تهيئة نظام الصوت
    initSoundSystem();
    
    // إخفاء شاشة التحميل وإظهار المحتوى
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        animateOnce(document.getElementById('mainContent'), 'fadeIn');
    }, 1000);
    
    isInitialized = true;
}

function initUI() {
    // تحديث عدد البطاقات
    updateCardsCount();
    
    // تهيئة النظام الليلي
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('toggleTheme').innerHTML = '<i class="fas fa-sun"></i> الوضع النهاري';
    }
    
    // تهيئة نظام الصوت
    updateSoundButton();
    
    // عرض البطاقات
    renderCards();
    
    // إضافة الأحداث
    setupEventListeners();
}

// === عرض البطاقات ===
function renderCards() {
    if (!elements.grid) return;
    
    if (!ITEMS.length) {
        elements.grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="width: 100px; height: 100px; background: #F3F4F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 40px; color: #9CA3AF;">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 style="color: #6B7280; margin-bottom: 10px;">لا توجد بطاقات</h3>
                <p style="color: #9CA3AF; margin-bottom: 20px;">يمكنك رفع ملف البيانات أو استخدام البيانات الافتراضية</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="useDefaultsBtn2" class="btn btn-primary">
                        <i class="fas fa-database"></i> استخدام البيانات الافتراضية
                    </button>
                    <label class="btn btn-outline" style="cursor: pointer;">
                        <i class="fas fa-upload"></i> رفع ملف بيانات
                        <input type="file" id="fileUpload2" accept=".json" style="display: none;">
                    </label>
                </div>
            </div>
        `;
        
        document.getElementById('useDefaultsBtn2')?.addEventListener('click', useDefaultData);
        document.getElementById('fileUpload2')?.addEventListener('change', handleFileUpload);
        return;
    }
    
    currentOrder = [...ITEMS];
    elements.grid.innerHTML = '';
    
    currentOrder.forEach(item => {
        const card = createCardElement(item);
        elements.grid.appendChild(card);
    });
}

function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    
    const language = elements.langSelect?.value || 'ar';
    const cardName = item[language] || item.ar || item.en || '';
    
    card.innerHTML = `
        <div class="card-inner">
            <div class="face front">
                <img class="figure" src="${getImgSrc(item)}" alt="${cardName}" 
                     onerror="this.src='assets/placeholder.png'; this.onerror=null;" />
                <div class="actions">
                    <button class="icon-btn speak" title="نطق الكلمة">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="icon-btn info" title="معلومات البطاقة">
                        <i class="fas fa-info"></i>
                    </button>
                </div>
                <div class="name ${showNames ? '' : 'hidden'}">${cardName}</div>
            </div>
            <div class="face back">
                <div class="name">${cardName}</div>
                <div class="actions">
                    <button class="icon-btn speak" title="نطق الكلمة">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="icon-btn flip-back" title="العودة">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
                <div class="card-details" style="margin-top: 15px; font-size: 14px; color: #6B7280;">
                    ${item.category ? `<div><i class="fas fa-folder"></i> ${item.category}</div>` : ''}
                    ${item.difficulty ? `<div><i class="fas fa-star"></i> ${['سهل', 'متوسط', 'صعب'][item.difficulty - 1]}</div>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // أحداث النقر
    card.addEventListener('click', (e) => {
        if (e.target.closest('.speak') || e.target.closest('.info') || e.target.closest('.flip-back')) {
            return;
        }
        card.classList.toggle('flipped');
        playSound('flip');
        trackCardFlip(item.id);
    });
    
    // أحداث الأزرار
    const speakBtn = card.querySelector('.speak');
    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            speakText(cardName, language);
            playSound('click');
        });
    }
    
    const infoBtn = card.querySelector('.info');
    if (infoBtn) {
        infoBtn.addEventListener('click', () => {
            showCardInfo(item);
            playSound('click');
        });
    }
    
    const flipBackBtn = card.querySelector('.flip-back');
    if (flipBackBtn) {
        flipBackBtn.addEventListener('click', () => {
            card.classList.remove('flipped');
            playSound('click');
        });
    }
    
    return card;
}

// === نظام النطق ===
function speakText(text, lang) {
    if (!('speechSynthesis' in window)) {
        showNotification('متصفحك لا يدعم النطق الصوتي', 'warning');
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    
    // إيقاف أي نطق سابق
    window.speechSynthesis.cancel();
    
    // بدء النطق
    window.speechSynthesis.speak(utterance);
    
    // تتبع النطق
    trackCardSpeak(text);
}

// === نظام الصوت ===
function initSoundSystem() {
    // إنشاء عناصر الصوت
    const audioElements = {
        click: createAudioElement('click'),
        flip: createAudioElement('flip'),
        success: createAudioElement('success'),
        error: createAudioElement('error'),
        win: createAudioElement('win')
    };
    
    window.appAudio = audioElements;
}

function createAudioElement(type) {
    const audio = document.createElement('audio');
    audio.preload = 'auto';
    
    // أصوات بسيطة باستخدام Web Audio API
    if (window.AudioContext) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext) {
                // نستخدم أصوات مدمجة بدلاً من ملفات
                return audio;
            }
        } catch (e) {
            console.log('Web Audio API غير مدعوم:', e);
        }
    }
    
    return audio;
}

function playSound(type) {
    if (!soundEnabled) return;
    
    try {
        if (window.appAudio && window.appAudio[type]) {
            const audio = window.appAudio[type];
            audio.currentTime = 0;
            audio.play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
        }
    } catch (e) {
        console.log('خطأ في نظام الصوت:', e);
    }
}

// === نظام الإحصائيات ===
function loadStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
        
        if (elements.totalPlays) {
            elements.totalPlays.textContent = stats.totalPlays || 0;
        }
        
        if (elements.totalWins) {
            elements.totalWins.textContent = stats.totalWins || 0;
        }
        
        if (elements.bestScore) {
            elements.bestScore.textContent = stats.bestScore || 0;
        }
        
        if (elements.playTime) {
            const time = stats.totalPlayTime || 0;
            const hours = Math.floor(time / 3600);
            const minutes = Math.floor((time % 3600) / 60);
            elements.playTime.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        }
    } catch (e) {
        console.error('خطأ في تحميل الإحصائيات:', e);
    }
}

function trackCardFlip(cardId) {
    try {
        const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
        stats.cardFlips = (stats.cardFlips || 0) + 1;
        
        // إحصائيات البطاقة
        if (!stats.cards) stats.cards = {};
        if (!stats.cards[cardId]) stats.cards[cardId] = { flips: 0, views: 0 };
        stats.cards[cardId].flips = (stats.cards[cardId].flips || 0) + 1;
        
        localStorage.setItem('appStats', JSON.stringify(stats));
    } catch (e) {
        console.error('خطأ في تتبع البطاقة:', e);
    }
}

function trackCardSpeak(text) {
    try {
        const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
        stats.speeches = (stats.speeches || 0) + 1;
        localStorage.setItem('appStats', JSON.stringify(stats));
    } catch (e) {
        console.error('خطأ في تتبع النطق:', e);
    }
}

// === نظام التنقل ===
function showSection(section) {
    // إخفاء جميع الأقسام
    [elements.cardsMode, elements.testsHub, elements.matchMode, elements.lettersMode]
        .forEach(s => s?.classList.add('hidden'));
    
    // إظهار القسم المطلوب
    section?.classList.remove('hidden');
    
    // إذا كان قسم البطاقات، نحدث العرض
    if (section === elements.cardsMode) {
        renderCards();
    }
    
    // إذا كان قسم الألعاب، نحدث الإحصائيات
    if (section === elements.testsHub) {
        loadStats();
    }
}

// === معالجة الأحداث ===
function setupEventListeners() {
    // تبديل اللغة
    if (elements.langSelect) {
        elements.langSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            renderCards();
            playSound('click');
        });
    }
    
    // إظهار/إخفاء الأسماء
    if (elements.toggleNamesBtn) {
        elements.toggleNamesBtn.addEventListener('click', () => {
            showNames = !showNames;
            renderCards();
            playSound('click');
            elements.toggleNamesBtn.innerHTML = showNames ? 
                '<i class="fas fa-eye-slash"></i> إخفاء الأسماء' : 
                '<i class="fas fa-eye"></i> إظهار الأسماء';
        });
    }
    
    // خلط البطاقات
    if (elements.shuffleBtn) {
        elements.shuffleBtn.addEventListener('click', () => {
            currentOrder = [...ITEMS].sort(() => Math.random() - 0.5);
            renderCards();
            playSound('click');
            showNotification('🔀 تم خلط البطاقات', 'success');
        });
    }
    
    // إعادة الترتيب
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', () => {
            currentOrder = [...ITEMS];
            renderCards();
            playSound('click');
            showNotification('🔄 تم إعادة ترتيب البطاقات', 'success');
        });
    }
    
    // التنقل الرئيسي
    if (elements.homeBtn) {
        elements.homeBtn.addEventListener('click', () => {
            showSection(elements.cardsMode);
            playSound('click');
        });
    }
    
    if (elements.testsBtn) {
        elements.testsBtn.addEventListener('click', () => {
            showSection(elements.testsHub);
            playSound('click');
        });
    }
    
    // التنقل في مركز الألعاب
    if (elements.goCards) {
        elements.goCards.addEventListener('click', () => {
            showSection(elements.cardsMode);
            playSound('click');
        });
    }
    
    if (elements.goMatch) {
        elements.goMatch.addEventListener('click', () => {
            initMatchGame();
            showSection(elements.matchMode);
            playSound('click');
        });
    }
    
    if (elements.goLetters) {
        elements.goLetters.addEventListener('click', () => {
            initLettersGame();
            showSection(elements.lettersMode);
            playSound('click');
        });
    }
    
    // العودة من الألعاب
    const backButtons = ['backToGames', 'backToGames2'];
    backButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                showSection(elements.testsHub);
                playSound('click');
            });
        }
    });
    
    // رفع الملفات
    const fileUploads = ['fileUpload', 'fileUpload2'];
    fileUploads.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', handleFileUpload);
        }
    });
    
    // حفظ البيانات
    const saveBtn = document.getElementById('saveFileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveToFile);
    }
    
    // البيانات الافتراضية
    const defaultBtns = ['useDefaultsBtn', 'useDefaultsBtn2'];
    defaultBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', useDefaultData);
        }
    });
    
    // الإحصائيات
    const statsBtn = document.getElementById('showStats');
    if (statsBtn) {
        statsBtn.addEventListener('click', showStatsModal);
    }
    
    // المساعدة
    const helpBtns = ['helpBtnMain', 'quickHelp', 'matchHelp', 'lettersHelp'];
    helpBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => showHelpModal('general'));
        }
    });
    
    // الصوت
    const soundBtn = document.getElementById('toggleSound');
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    // الوضع الليلي
    const themeBtn = document.getElementById('toggleTheme');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // حول التطبيق
    const aboutBtn = document.getElementById('showAbout');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', showAboutModal);
    }
    
    // الإشعارات
    const closeTipBtn = document.getElementById('closeTip');
    if (closeTipBtn) {
        closeTipBtn.addEventListener('click', () => {
            document.getElementById('floatingTip').style.display = 'none';
        });
    }
}

// === معالجة رفع الملفات ===
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const success = await loadFromFile(file);
    if (success) {
        renderCards();
        showNotification(`📁 تم تحميل ${ITEMS.length} بطاقة بنجاح`, 'success');
        showFloatingTip('💡 يمكنك الآن استخدام البطاقات الجديدة في الألعاب التعليمية');
    } else {
        showNotification('❌ خطأ في تحميل الملف. تأكد من تنسيق JSON', 'error');
    }
    
    // إعادة تعيين المدخل
    e.target.value = '';
}

// === حفظ البيانات إلى ملف ===
function saveToFile() {
    if (!ITEMS.length) {
        showNotification('لا توجد بيانات لحفظها', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(ITEMS, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `بطاقات_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('💾 تم حفظ البيانات إلى ملف', 'success');
}

// === استخدام البيانات الافتراضية ===
function useDefaultData() {
    ITEMS = [...DEFAULTS];
    saveItems();
    renderCards();
    showNotification('🔄 تم تحميل البيانات الافتراضية', 'success');
    showFloatingTip('💡 يمكنك تعديل البطاقات أو إضافة بطاقات جديدة');
}

// === تحديث عدد البطاقات ===
function updateCardsCount() {
    if (elements.cardsCount) {
        elements.cardsCount.textContent = ITEMS.length;
    }
}

// === تحديث زر الصوت ===
function updateSoundButton() {
    const soundBtn = document.getElementById('toggleSound');
    if (soundBtn) {
        soundBtn.innerHTML = soundEnabled ? 
            '<i class="fas fa-volume-up"></i> إيقاف الصوت' : 
            '<i class="fas fa-volume-mute"></i> تشغيل الصوت';
    }
}

// === تبديل الصوت ===
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    updateSoundButton();
    playSound('click');
    showNotification(soundEnabled ? '🔊 تم تشغيل الصوت' : '🔇 تم إيقاف الصوت', 'info');
}

// === تبديل الوضع الليلي ===
function toggleTheme() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('toggleTheme').innerHTML = '<i class="fas fa-sun"></i> الوضع النهاري';
        showNotification('🌙 تم تفعيل الوضع الليلي', 'info');
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('toggleTheme').innerHTML = '<i class="fas fa-moon"></i> الوضع الليلي';
        showNotification('☀️ تم تفعيل الوضع النهاري', 'info');
    }
    
    playSound('click');
}

// === عرض معلومات البطاقة ===
function showCardInfo(item) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #111827;">
                    <i class="fas fa-info-circle"></i> معلومات البطاقة
                </h2>
                <button class="btn btn-subtle" id="closeCardInfo" style="padding: 8px 12px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="${getImgSrc(item)}" alt="${item.ar}" 
                     style="max-width: 200px; max-height: 200px; object-fit: contain; border-radius: 12px; margin-bottom: 15px;" 
                     onerror="this.src='assets/placeholder.png'; this.onerror=null;" />
                <h3 style="margin: 0 0 10px 0; color: #111827;">${item.ar} / ${item.en}</h3>
                <div style="color: #6B7280; font-size: 14px;">ID: ${item.id}</div>
            </div>
            
            <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #6B7280; margin-bottom: 5px;">الفئة</div>
                        <div style="font-weight: 600; color: #111827;">${item.category || 'عام'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6B7280; margin-bottom: 5px;">المستوى</div>
                        <div style="font-weight: 600; color: #111827;">
                            ${item.difficulty ? ['سهل', 'متوسط', 'صعب'][item.difficulty - 1] : 'غير محدد'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" id="speakCardInfo">
                    <i class="fas fa-volume-up"></i> نطق الكلمة
                </button>
                <button class="btn btn-subtle" id="closeCardInfo2">
                    <i class="fas fa-check"></i> إغلاق
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // أحداث الإغلاق
    const closeBtns = ['closeCardInfo', 'closeCardInfo2'];
    closeBtns.forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            modal.classList.add('fadeOut');
            setTimeout(() => modal.remove(), 300);
            playSound('click');
        });
    });
    
    // نطق الكلمة
    document.getElementById('speakCardInfo').addEventListener('click', () => {
        const language = elements.langSelect?.value || 'ar';
        speakText(item[language] || item.ar || item.en, language);
        playSound('click');
    });
    
    // إغلاق بالنقر خارج النافذة
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('fadeOut');
            setTimeout(() => modal.remove(), 300);
            playSound('click');
        }
    });
}

// === لعبة المطابقة ===
function initMatchGame() {
    // سيتم تنفيذ هذا في المرحلة التالية
    console.log('تهيئة لعبة المطابقة');
}

// === لعبة الحروف ===
function initLettersGame() {
    // سيتم تنفيذ هذا في المرحلة التالية
    console.log('تهيئة لعبة الحروف');
}

// === الإشعارات ===
function showNotification(message, type = 'info') {
    const area = document.getElementById('notificationArea');
    if (!area) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
                    ${getNotificationIcon(type)} ${message}
                </div>
            </div>
            <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 12px;" id="closeNotif">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    area.appendChild(notification);
    
    // إغلاق الإشعار
    notification.querySelector('#closeNotif').addEventListener('click', () => {
        notification.classList.add('fadeOut');
        setTimeout(() => notification.remove(), 300);
    });
    
    // إزالة تلقائية بعد 5 ثوان
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fadeOut');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

// === التلميحات العائمة ===
function showFloatingTip(message) {
    const tip = document.getElementById('floatingTip');
    if (!tip) return;
    
    document.getElementById('tipContent').textContent = message;
    tip.style.display = 'block';
    
    // إخفاء تلقائي بعد 10 ثوان
    setTimeout(() => {
        tip.style.display = 'none';
    }, 10000);
}

// === النماذج المنبثقة ===
function showStatsModal() {
    const modal = document.getElementById('statsModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // تحديث الإحصائيات
    updateStatsModal();
    
    // أحداث الإغلاق
    const closeBtns = ['closeStats', 'closeStats2'];
    closeBtns.forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            modal.classList.add('hidden');
            playSound('click');
        });
    });
    
    // تصدير الإحصائيات
    document.getElementById('exportStats').addEventListener('click', exportStats);
    
    // مسح الإحصائيات
    document.getElementById('clearStats').addEventListener('click', clearStats);
}

function updateStatsModal() {
    try {
        const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
        
        // الإحصائيات الأساسية
        document.getElementById('statCards').textContent = ITEMS.length;
        document.getElementById('statPlays').textContent = stats.totalPlays || 0;
        document.getElementById('statWins').textContent = stats.totalWins || 0;
        
        const time = stats.totalPlayTime || 0;
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        document.getElementById('statTime').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        
        // أفضل البطاقات
        updateTopCards(stats.cards || {});
        
        // النشاط اليومي
        updateDailyActivity(stats.daily || {});
    } catch (e) {
        console.error('خطأ في تحديث إحصائيات النافذة:', e);
    }
}

function updateTopCards(cardsData) {
    const container = document.getElementById('topCardsList');
    if (!container) return;
    
    const cards = Object.entries(cardsData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (b.flips || 0) - (a.flips || 0))
        .slice(0, 5);
    
    if (cards.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #9CA3AF; padding: 20px;">لا توجد بيانات عن البطاقات</div>';
        return;
    }
    
    container.innerHTML = cards.map((card, index) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #E5E7EB; ${index === cards.length - 1 ? 'border-bottom: none;' : ''}">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 30px; height: 30px; background: #F3F4F6; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6B7280;">
                    ${index + 1}
                </div>
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${card.id}</div>
                    <div style="font-size: 12px; color: #9CA3AF;">${card.flips || 0} مرة</div>
                </div>
            </div>
            <div style="color: #2563EB; font-weight: 600; font-size: 14px;">
                ${card.flips || 0}
            </div>
        </div>
    `).join('');
}

function updateDailyActivity(dailyData) {
    const container = document.getElementById('dailyActivity');
    if (!container) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayData = dailyData[today];
    
    if (!todayData) {
        container.innerHTML = '<div style="text-align: center;">لا يوجد نشاط اليوم</div>';
        return;
    }
    
    container.innerHTML = `
        <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #2563EB;">${todayData.cardFlips || 0}</div>
                    <div style="font-size: 12px; color: #6B7280;">قلب بطاقة</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #10B981;">${todayData.speeches || 0}</div>
                    <div style="font-size: 12px; color: #6B7280;">نطق</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #F59E0B;">${todayData.games || 0}</div>
                    <div style="font-size: 12px; color: #6B7280;">لعبة</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #9CA3AF; text-align: center;">
                نشاط اليوم ${new Date().toLocaleDateString('ar-EG')}
            </div>
        </div>
    `;
}

function exportStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
        const data = {
            ...stats,
            itemsCount: ITEMS.length,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `إحصائيات_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📊 تم تصدير الإحصائيات', 'success');
        playSound('success');
    } catch (e) {
        console.error('خطأ في تصدير الإحصائيات:', e);
        showNotification('❌ خطأ في تصدير الإحصائيات', 'error');
    }
}

function clearStats() {
    if (!confirm('هل أنت متأكد من مسح جميع الإحصائيات؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    try {
        localStorage.removeItem('appStats');
        updateStatsModal();
        showNotification('🗑️ تم مسح جميع الإحصائيات', 'success');
        playSound('success');
    } catch (e) {
        console.error('خطأ في مسح الإحصائيات:', e);
        showNotification('❌ خطأ في مسح الإحصائيات', 'error');
    }
}

function showHelpModal(context = 'general') {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // أحداث الإغلاق
    const closeBtns = ['closeHelp', 'closeHelp2'];
    closeBtns.forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            modal.classList.add('hidden');
            playSound('click');
        });
    });
}

function showAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // أحداث الإغلاق
    const closeBtns = ['closeAbout', 'closeAbout2'];
    closeBtns.forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            modal.classList.add('hidden');
            playSound('click');
        });
    });
}

// === تهيئة عند تحميل الصفحة ===
document.addEventListener('DOMContentLoaded', () => {
    // بدء النظام بعد تحميل الصفحة
    setTimeout(initSystem, 500);
    
    // تلميح ترحيبي
    setTimeout(() => {
        showFloatingTip('مرحبًا! يمكنك النقر على أي بطاقة لقلبها ومعرفة اسمها');
    }, 2000);
});

// === تصدير الدوال للاستخدام العالمي ===
window.app = {
    initSystem,
    renderCards,
    speakText,
    playSound,
    showNotification,
    saveToFile,
    useDefaultData
};
