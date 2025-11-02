// script.js - comportamiento ASOMARK
document.addEventListener('DOMContentLoaded', ()=> {

  /* THEME ELEMENTS (obtener referencia antes de usarla) */
  const themeToggle = document.getElementById('themeToggle');

  function updateThemeIcon(){
    const icon = document.getElementById('themeIcon');
    const isLight = document.body.classList.contains('light-theme');
    // proteger si themeToggle no existe
    if(themeToggle){
      themeToggle.title = isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
      themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    }
    // (opcional) actualizar el color o atributo del icono si hace falta
    if(icon) {
      // ejemplo: cambiar stroke por clase (si necesitas)
    }
  }

  /* THEME INIT */
  (function initTheme(){
    const saved = localStorage.getItem('asomark_theme');
    if(saved === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    updateThemeIcon();
  })();

  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('asomark_theme', isLight ? 'light' : 'dark');
      updateThemeIcon();
    });
  }

  /* NAVIGATION (app-like screens) */
  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if(el) el.classList.add('active');
    // scroll top
    try { el.scrollTop = 0 } catch(e){}
  }
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> showScreen(btn.dataset.target));
  });
  // hero buttons
  document.querySelectorAll('.hero-actions [data-target]').forEach(b=>{
    b.addEventListener('click', ()=> showScreen(b.dataset.target));
  });
  const btnContactFromHero = document.getElementById('btnContactFromHero');
  if(btnContactFromHero) btnContactFromHero.addEventListener('click', ()=> showScreen('contact'));

  /* MODALS */
  const legalModal = document.getElementById('legalModal');
  const calcModal = document.getElementById('calcModal');
  const loginModal = document.getElementById('loginModal');

  function openModal(modal){
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(modal){
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
  }

  window.openLegal = function(e){ if(e) e.preventDefault(); openModal(legalModal); };
  window.closeLegal = function(){ closeModal(legalModal); };
  window.acceptLegal = function(){
    localStorage.setItem('asomark_legal_accepted','1');
    closeModal(legalModal);
  };

  // show legal on first visit
  if(!localStorage.getItem('asomark_legal_accepted')){
    setTimeout(()=> openModal(legalModal), 450);
  }

  // calculator open/close
  window.openCalculatorFor = function(serviceType, planKey){
    const st = document.getElementById('serviceType');
    const ps = document.getElementById('planSelect');
    st.value = (serviceType === 'capacitacion') ? 'capacitacion' : 'asesoria';
    if(planKey) ps.value = planKey;
    updatePlanVisibility();
    document.getElementById('calcResult').innerHTML = '';
    openModal(calcModal);
    setTimeout(()=> { try { document.getElementById('workersInput').focus(); } catch(e){} }, 120);
  };
  window.closeCalculator = function(){ closeModal(calcModal); document.getElementById('calcResult').innerHTML = ''; };

  // login modal
  const loginBtn = document.getElementById('loginBtn');
  if(loginBtn) loginBtn.addEventListener('click', ()=> openModal(loginModal));
  window.closeLogin = function(){ closeModal(loginModal); };

  // close by clicking outside
  document.querySelectorAll('.modal-backdrop').forEach(back=>{
    back.addEventListener('click', (ev)=>{
      if(ev.target === back) closeModal(back);
    });
  });

  // esc to close
  window.addEventListener('keydown', (e)=> { if(e.key === 'Escape'){ document.querySelectorAll('.modal-backdrop').forEach(m=> m.style.display='none'); } });

  /* CALCULADORA LOGIC */
  const plansData = {
    basic: {
      ranges: [
        {min:1,max:2, price:600000},
        {min:3,max:5, price:1000000},
        {min:6,max:8, price:1600000}
      ],
      extraPerEmployee: 170000
    },
    premium: {
      ranges: [
        {min:1,max:2, price:1100000},
        {min:3,max:5, price:1480000},
        {min:6,max:8, price:2096000}
      ],
      extraPerEmployee: 165000
    },
    vip: {
      ranges: [
        {min:1,max:2, price:1500000},
        {min:3,max:5, price:1896000},
        {min:6,max:8, price:2492000}
      ],
      extraPerEmployee: 160000
    }
  };

  function computeCapacitacion(trabajadores){
    trabajadores = Math.max(1, Math.floor(trabajadores));
    if(trabajadores <= 2) return trabajadores * 245000;
    if(trabajadores <= 5) return trabajadores * 240000;
    if(trabajadores <= 8) return trabajadores * 235000;
    return 235000 * 8 + (trabajadores - 8) * 232000;
  }

  function computeAsesoria(planKey, trabajadores){
    trabajadores = Math.max(1, Math.floor(trabajadores));
    const plan = plansData[planKey];
    let range = plan.ranges.find(r => trabajadores >= r.min && trabajadores <= r.max);
    if(range) return range.price;
    // más de 8
    const top = plan.ranges.find(r => r.max === 8);
    return top.price + (trabajadores - 8) * plan.extraPerEmployee;
  }

  // planBlock visibility
  const serviceTypeEl = document.getElementById('serviceType');
  if(serviceTypeEl) serviceTypeEl.addEventListener('change', updatePlanVisibility);
  function updatePlanVisibility(){
    const v = document.getElementById('serviceType').value;
    document.getElementById('planBlock').style.display = (v === 'asesoria') ? 'block' : 'none';
  }
  updatePlanVisibility();

  // calculate action
  window.calculate = function(){
    const service = document.getElementById('serviceType').value;
    const plan = document.getElementById('planSelect').value;
    const activity = document.getElementById('activityType').value;
    let workers = parseInt(document.getElementById('workersInput').value) || 1;
    if(workers < 1) workers = 1;
    let total = 0;
    if(service === 'capacitacion') total = computeCapacitacion(workers);
    else total = computeAsesoria(plan, workers);

    const formatted = total.toLocaleString('es-CO', {style:'currency',currency:'COP',maximumFractionDigits:0});
    let html = `<div><strong>Tipo de servicio:</strong> ${service === 'capacitacion' ? 'Capacitación' : 'Asesorías'}</div>`;
    if(service === 'asesoria') html += `<div><strong>Plan seleccionado:</strong> ${plan === 'basic' ? 'Básico' : plan === 'premium' ? 'Premium' : 'VIP'}</div>`;
    html += `<div><strong>Tipo de actividad:</strong> ${activity}</div>`;
    html += `<div><strong>Número de trabajadores:</strong> ${workers}</div>`;
    html += `<div style="margin-top:8px"><strong>Total a pagar:</strong> ${formatted}</div>`;
    html += `<div class="muted" style="margin-top:6px;font-size:13px">Sin cuotas, sin intereses, sin valor base.</div>`;
    document.getElementById('calcResult').innerHTML = html;
  };

  /* CONTACT (demo) */
  window.handleContact = function(e){
    e.preventDefault();
    const name = document.getElementById('contactName').value || '—';
    alert('Gracias, ' + name + '. Tu mensaje ha sido recibido (demo).');
    document.getElementById('contactForm').reset();
    showScreen('inicio');
  };

  // default screen
  showScreen('inicio');
});
