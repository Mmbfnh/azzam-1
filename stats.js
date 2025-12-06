// نظام تتبع الإحصائيات
const StatsSystem = {
  stats: {
    firstSession: 0,
    lastSession: 0,
    cardsFlipped: 0,
    cardsSpoken: 0,
    cardsShuffled: 0,
    matchCompleted: 0,
    matchTimeout: 0,
    lettersStarted: 0,
    lettersCompleted: 0
  },
  
  init: function() {
    // تحميل الإحصائيات المحفوظة
    const savedStats = localStorage.getItem('appStats');
    if (savedStats) {
      this.stats = JSON.parse(savedStats);
    }
    
    // تحديث تواريخ الجلسة
    const now = new Date().getTime();
    if (!this.stats.firstSession) {
      this.stats.firstSession = now;
    }
    this.stats.lastSession = now;
    
    this.save();
    console.log('✅ نظام الإحصائيات جاهز');
  },
  
  update: function(statName, value = 1) {
    if (this.stats[statName] !== undefined) {
      this.stats[statName] += value;
      this.save();
    }
  },
  
  get: function(statName) {
    return this.stats[statName] || 0;
  },
  
  getAll: function() {
    return {...this.stats};
  },
  
  save: function() {
    localStorage.setItem('appStats', JSON.stringify(this.stats));
  },
  
  reset: function() {
    this.stats = {
      firstSession: new Date().getTime(),
      lastSession: new Date().getTime(),
      cardsFlipped: 0,
      cardsSpoken: 0,
      cardsShuffled: 0,
      matchCompleted: 0,
      matchTimeout: 0,
      lettersStarted: 0,
      lettersCompleted: 0
    };
    this.save();
  }
};

// تهيئة نظام الإحصائيات عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
  StatsSystem.init();
});

// دوال مساعدة للاستخدام السهل
function updateStats(statName, value = 1) {
  StatsSystem.update(statName, value);
}

function getStats(statName) {
  if (statName) {
    return StatsSystem.get(statName);
  }
  return StatsSystem.getAll();
}

function resetAllStats() {
  StatsSystem.reset();
}
