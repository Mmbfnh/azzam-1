// نظام الصوت للتطبيق
const SoundSystem = {
  sounds: {
    click: {
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
      volume: 0.3
    },
    success: {
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
      volume: 0.4
    },
    error: {
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
      volume: 0.4
    },
    drop: {
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
      volume: 0.3
    },
    speak: {
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-bubble-pop-up-alert-notification-2357.mp3',
      volume: 0.2
    },
    timeout: {
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-sad-game-over-trombone-471.mp3',
      volume: 0.3
    }
  },
  
  audioElements: {},
  enabled: true,
  
  init: function() {
    // تحميل الإعدادات
    this.enabled = (localStorage.getItem('clickSound') || 'off') === 'on';
    
    // إنشاء عناصر صوتية لكل نوع
    Object.keys(this.sounds).forEach(key => {
      const audio = new Audio(this.sounds[key].url);
      audio.volume = this.sounds[key].volume;
      audio.preload = 'auto';
      this.audioElements[key] = audio;
    });
    
    console.log('✅ نظام الصوت جاهز');
  },
  
  play: function(soundName) {
    if (!this.enabled) return;
    
    const audio = this.audioElements[soundName];
    if (audio) {
      // إعادة تعيين الصوت إذا كان يشغل
      audio.currentTime = 0;
      
      // تشغيل الصوت
      audio.play().catch(e => {
        console.log('⚠️ تعذر تشغيل الصوت:', e);
      });
    }
  },
  
  toggle: function() {
    this.enabled = !this.enabled;
    localStorage.setItem('clickSound', this.enabled ? 'on' : 'off');
    return this.enabled;
  },
  
  isEnabled: function() {
    return this.enabled;
  }
};

// تهيئة نظام الصوت عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
  SoundSystem.init();
});

// دالة مساعدة للاستخدام السهل
function playSound(soundName) {
  SoundSystem.play(soundName);
}

// دالة لتبديل حالة الصوت
function toggleSound() {
  return SoundSystem.toggle();
}

// دالة للتحقق من حالة الصوت
function isSoundEnabled() {
  return SoundSystem.isEnabled();
}
