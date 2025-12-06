// === Animate.css helper ===
function animateOnce(el, className, dur=800){ if(!el) return; el.classList.add('animated', className); setTimeout(()=>{ el.classList.remove('animated', className); }, dur); }

// === نظام المصادقة ===
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  const username = localStorage.getItem('adminUsername');
  
  // إذا كان في صفحة تسجيل الدخول، لا نتحقق
  if (window.location.pathname.includes('login.html')) {
    return false;
  }
  
  // إذا لم يكن هناك توكن، نوجه إلى تسجيل الدخول
  if (!token || !username) {
    window.location.href = 'login.html';
    return false;
  }
  
  // التحقق من صحة التوكن
  const savedToken = localStorage.getItem('adminToken');
  const savedTime = localStorage.getItem('adminLoginTime');
  
  if (!savedToken || !savedTime) {
    window.location.href = 'login.html';
    return false;
  }
  
  // التحقق من انتهاء الجلسة (24 ساعة)
  const loginTime = parseInt(savedTime);
  const currentTime = new Date().getTime();
  const hoursDiff = (currentTime - loginTime) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'login.html';
    return false;
  }
  
  return true;
}

// === تسجيل الدخول ===
function setupLogin() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  
  if (!loginForm) return;
  
  // إعدادات الدخول الافتراضية
  const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: '1234'
  };
  
  // محاولة تحميل بيانات المستخدم المحفوظة
  let userCredentials = JSON.parse(localStorage.getItem('adminCredentials')) || DEFAULT_CREDENTIALS;
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // التحقق من بيانات الدخول
    if (username === userCredentials.username && password === userCredentials.password) {
      // إنشاء توكن عشوائي
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      
      // حفظ بيانات الجلسة
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUsername', username);
      localStorage.setItem('adminLoginTime', new Date().getTime().toString());
      
      // توجيه إلى لوحة التحكم
      window.location.href = 'admin.html';
    } else {
      loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      loginError.classList.add('show');
      animateOnce(loginError, 'pulse');
      playSound('error');
    }
  });
}

// === تغيير كلمة المرور ===
function setupChangePassword() {
  const changePassBtn = document.getElementById('changePasswordBtn');
  const changePassModal = document.getElementById('changePassModal');
  const changePassForm = document.getElementById('changePassForm');
  const cancelChangePass = document.getElementById('cancelChangePass');
  const passError = document.getElementById('passError');
  
  if (!changePassBtn) return;
  
  changePassBtn.addEventListener('click', () => {
    changePassModal.classList.remove('hidden');
    animateOnce(changePassModal, 'fadeInUp');
    playSound('click');
  });
  
  cancelChangePass.addEventListener('click', () => {
    changePassModal.classList.add('hidden');
    playSound('click');
  });
  
  changePassModal.addEventListener('click', (e) => {
    if (e.target === changePassModal) {
      changePassModal.classList.add('hidden');
    }
  });
  
  changePassForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPass = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;
    
    // تحميل بيانات المستخدم الحالية
    const savedCredentials = JSON.parse(localStorage.getItem('adminCredentials')) || {
      username: 'admin',
      password: '1234'
    };
    
    // التحقق من كلمة المرور الحالية
    if (currentPass !== savedCredentials.password) {
      passError.textContent = 'كلمة المرور الحالية غير صحيحة';
      passError.classList.add('show');
      animateOnce(passError, 'pulse');
      playSound('error');
      return;
    }
    
    // التحقق من تطابق كلمتي المرور الجديدتين
    if (newPass !== confirmPass) {
      passError.textContent = 'كلمتا المرور الجديدتين غير متطابقتين';
      passError.classList.add('show');
      animateOnce(passError, 'pulse');
      playSound('error');
      return;
    }
    
    // التحقق من طول كلمة المرور
    if (newPass.length < 4) {
      passError.textContent = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
      passError.classList.add('show');
      animateOnce(passError, 'pulse');
      playSound('error');
      return;
    }
    
    // تحديث بيانات المستخدم
    savedCredentials.password = newPass;
    localStorage.setItem('adminCredentials', JSON.stringify(savedCredentials));
    
    // إظهار رسالة نجاح
    alert('تم تغيير كلمة المرور بنجاح');
    playSound('success');
    
    // إغلاق النافذة
    changePassModal.classList.add('hidden');
    changePassForm.reset();
    passError.classList.remove('show');
  });
}

// === تسجيل الخروج ===
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('adminLoginTime');
      window.location.href = 'login.html';
    }
  });
}

// === Items state ===
const DEFAULTS = window.DEFAULT_ITEMS || [];
let ITEMS = loadItems() || DEFAULTS.slice();

function loadItems(){ 
  try{ 
    const raw = localStorage.getItem('cardsItems'); 
    return raw ? JSON.parse(raw) : null; 
  } catch(e){ 
    return null; 
  } 
}

function saveItems(){ 
  localStorage.setItem('cardsItems', JSON.stringify(ITEMS)); 
}

function getImgSrc(item){ 
  return item.img || `assets/${item.id}.png`; 
}

// === Admin refs ===
const itemsList = document.getElementById('itemsList');
const form = document.getElementById('adminForm');
const f_id = document.getElementById('f_id');
const f_en = document.getElementById('f_en');
const f_ar = document.getElementById('f_ar');
const f_img = document.getElementById('f_img');
const f_file = document.getElementById('f_file');
const clearFormBtn = document.getElementById('clearForm');
const formMsg = document.getElementById('formMsg');
const adminPreview = document.getElementById('adminPreview');
const exportJsonBtn = document.getElementById('exportJson');
const importJsonInput = document.getElementById('importJson');
const resetDefaultsBtn = document.getElementById('resetDefaults');
const resetStatsBtn = document.getElementById('resetStatsBtn');

function renderAdminList(){ 
  itemsList.innerHTML=''; 
  ITEMS.forEach((item, idx)=>{ 
    const li=document.createElement('li'); 
    li.className='item-card'; 
    li.innerHTML=`
      <img src="${getImgSrc(item)}" alt="${item.en}">
      <div class="item-meta">
        <div><strong>${item.en} / ${item.ar}</strong></div>
        <div style="opacity:.7">ID: ${item.id}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-outline" data-act="edit" data-idx="${idx}">تعديل</button>
        <button class="btn btn-danger" data-act="del" data-idx="${idx}">حذف</button>
      </div>
    `; 
    li.querySelector('[data-act="edit"]').addEventListener('click', ()=> fillFormForEdit(idx)); 
    li.querySelector('[data-act="del"]').addEventListener('click', ()=> deleteItem(idx)); 
    itemsList.appendChild(li); 
  }); 
  
  // عرض إحصائيات لوحة التحكم
  updateAdminStats();
}

function fillFormForEdit(i){ 
  const item=ITEMS[i]; 
  f_id.value=item.id; 
  f_en.value=item.en; 
  f_ar.value=item.ar; 
  f_img.value=item.img||''; 
  adminPreview.src=getImgSrc(item); 
  formMsg.textContent=`تحرير: ${item.id}`; 
  animateOnce(form,'fadeInUp'); 
  playSound('click');
}

function deleteItem(i){ 
  if(!confirm('حذف العنصر؟')) return; 
  ITEMS.splice(i,1); 
  saveItems(); 
  renderAdminList(); 
  playSound('click');
}

clearFormBtn.addEventListener('click', ()=>{ 
  f_id.value=''; 
  f_en.value=''; 
  f_ar.value=''; 
  f_img.value=''; 
  adminPreview.src=''; 
  formMsg.textContent=''; 
  playSound('click');
});

f_file.addEventListener('change', ()=>{ 
  const file=f_file.files[0]; 
  if(!file) return; 
  const reader=new FileReader(); 
  reader.onload=()=>{ 
    adminPreview.src=reader.result; 
  }; 
  reader.readAsDataURL(file); 
  playSound('click');
});

form.addEventListener('submit', (e)=>{ 
  e.preventDefault(); 
  const id=f_id.value.trim(); 
  const en=f_en.value.trim(); 
  const ar=f_ar.value.trim(); 
  let imgSrc=f_img.value.trim(); 
  
  if(!id || !en || !ar){ 
    formMsg.textContent='يرجى ملء كل الحقول المطلوبة'; 
    playSound('error');
    return; 
  } 
  
  if(!imgSrc && adminPreview.src){ 
    imgSrc=adminPreview.src; 
  }
  
  const existsIdx=ITEMS.findIndex(x=> x.id===id); 
  const obj={id,en,ar}; 
  if(imgSrc) obj.img=imgSrc; 
  
  if(existsIdx>=0){ 
    ITEMS[existsIdx]=obj; 
    formMsg.textContent='تم تحديث العنصر'; 
  } else { 
    ITEMS.push(obj); 
    formMsg.textContent='تمت إضافة العنصر'; 
  }
  
  saveItems(); 
  renderAdminList(); 
  animateOnce(itemsList,'fadeInUp'); 
  playSound('success');
});

exportJsonBtn.addEventListener('click', ()=>{ 
  const blob=new Blob([JSON.stringify(ITEMS,null,2)],{type:'application/json'}); 
  const a=document.createElement('a'); 
  a.href=URL.createObjectURL(blob); 
  a.download='cardsItems.json'; 
  a.click(); 
  URL.revokeObjectURL(a.href); 
  animateOnce(exportJsonBtn,'pulse'); 
  playSound('click');
});

importJsonInput.addEventListener('change', ()=>{ 
  const file=importJsonInput.files[0]; 
  if(!file) return; 
  const reader=new FileReader(); 
  reader.onload=()=>{ 
    try{ 
      const data=JSON.parse(reader.result); 
      if(Array.isArray(data)){ 
        ITEMS=data; 
        saveItems(); 
        renderAdminList(); 
        alert('تم الاستيراد بنجاح'); 
        animateOnce(itemsList,'fadeInUp'); 
        playSound('success');
      } 
    }catch(err){ 
      alert('ملف JSON غير صالح'); 
      playSound('error');
    } 
  }; 
  reader.readAsText(file); 
});

resetDefaultsBtn.addEventListener('click', ()=>{ 
  if(!confirm('الرجوع للوضع الافتراضي؟')) return; 
  ITEMS = DEFAULTS.slice(); 
  saveItems(); 
  renderAdminList(); 
  animateOnce(resetDefaultsBtn,'pulse'); 
  playSound('click');
});

resetStatsBtn.addEventListener('click', ()=>{ 
  if(!confirm('مسح جميع الإحصائيات؟ لا يمكن التراجع عن هذا الإجراء.')) return; 
  resetAllStats(); 
  alert('تم مسح جميع الإحصائيات'); 
  updateAdminStats(); 
  playSound('click');
});

// === إعدادات الصوت ===
let clickSoundEnabled = (localStorage.getItem('clickSound') || 'off') === 'on';

function setupSoundSettings() {
  const onBtn = document.getElementById('soundOn');
  const offBtn = document.getElementById('soundOff');
  
  if(!onBtn || !offBtn) return;
  
  const syncUI = ()=>{
    onBtn.setAttribute('aria-pressed', clickSoundEnabled? 'true':'false');
    offBtn.setAttribute('aria-pressed', clickSoundEnabled? 'false':'true');
    onBtn.classList.toggle('is-on', clickSoundEnabled);
    offBtn.classList.toggle('is-on', !clickSoundEnabled);
  };
  
  onBtn.addEventListener('click', ()=>{
    clickSoundEnabled = true;
    localStorage.setItem('clickSound','on');
    animateOnce(onBtn,'pulse');
    syncUI();
    playSound('click');
  });
  
  offBtn.addEventListener('click', ()=>{
    clickSoundEnabled = false;
    localStorage.setItem('clickSound','off');
    animateOnce(offBtn,'pulse');
    syncUI();
    // لا نلعب صوت هنا لأنه تم إيقاف الأصوات
  });
  
  syncUI();
}

// === عرض إحصائيات لوحة التحكم ===
function updateAdminStats() {
  const adminStatsEl = document.getElementById('adminStats');
  if (!adminStatsEl) return;
  
  const stats = getStats();
  const itemsCount = ITEMS.length;
  
  adminStatsEl.innerHTML = `
    <div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap; margin-top:10px">
      <span>📁 العناصر: ${itemsCount}</span>
      <span>🎴 البطاقات المقروءة: ${stats.cardsFlipped}</span>
      <span>🎯 الاختبارات المكتملة: ${stats.matchCompleted}</span>
    </div>
  `;
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
  // التحقق من المصادقة
  if (window.location.pathname.includes('admin.html')) {
    if (!checkAuth()) return;
  }
  
  // إعداد نظام تسجيل الدخول
  setupLogin();
  
  // إعداد لوحة التحكم
  if (window.location.pathname.includes('admin.html')) {
    renderAdminList();
    setupSoundSettings();
    setupChangePassword();
    setupLogout();
  }
});
