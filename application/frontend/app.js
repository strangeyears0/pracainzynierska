/**
 * SYSTEM REZERWACJI ZASOBÓW BIUROWECH - AETHER TOWER FRONTEND APP LOGIC
 */

const CONFIG = {
  RESERVATION_API: 'http://localhost:8000',
  NOTIFICATION_API: 'http://localhost:8001',
};

// Global state
let state = {
  isReservationApiLive: false,
  currentFloor: 42,
  selectedResourceId: null,
  resources: [],
  reservations: [],
  currentUser: {
    name: 'Mateusz Thorne',
    email: 'mateusz.thorne@aethertower.pl',
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("Aether Tower OS - Initializing...");
  initSVGMap();
  initPanZoom();
  initEventListeners();
  checkServicesHealth().then(() => {
    refreshData();
  });
});

function initPanZoom() {
  const svg = document.querySelector('svg');
  if (!svg) return;

  let isDragging = false;
  let startX, startY;
  // Wymiary bazowe z pliku SVG (zaktualizowane do 720 wysokości)
  let vb = { x: 0, y: 0, w: 1000, h: 720 };
  
  const updateViewBox = () => {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  };

  svg.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    svg.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Skalujemy ruch myszki przez aktualny poziom przybliżenia
    const scaleX = vb.w / svg.clientWidth;
    const scaleY = vb.h / svg.clientHeight;
    
    vb.x -= dx * scaleX;
    vb.y -= dy * scaleY;
    
    startX = e.clientX;
    startY = e.clientY;
    updateViewBox();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    svg.style.cursor = 'pointer';
  });

  svg.addEventListener('wheel', (e) => {
    e.preventDefault(); 
    const zoomFactor = 1.1;
    let zoomDir = e.deltaY > 0 ? 1 : -1; 
    
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const ptX = vb.x + (mouseX / rect.width) * vb.w;
    const ptY = vb.y + (mouseY / rect.height) * vb.h;
    
    if (zoomDir < 0) {
      vb.w /= zoomFactor;
      vb.h /= zoomFactor;
    } else {
      vb.w *= zoomFactor;
      vb.h *= zoomFactor;
    }
    
    vb.x = ptX - (mouseX / rect.width) * vb.w;
    vb.y = ptY - (mouseY / rect.height) * vb.h;
    
    updateViewBox();
    updateZoomText();
  }, { passive: false });
  
  // Podpięcie przycisków
  const zoomInBtn = document.querySelector('button[title="Przybliż"]');
  const zoomOutBtn = document.querySelector('button[title="Oddal"]');
  const centerBtn = document.querySelector('button[title="Wyśrodkuj widok"]');
  
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomCenter(0.8));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomCenter(1.25));
  if (centerBtn) centerBtn.addEventListener('click', () => {
     vb = { x: 0, y: 0, w: 1000, h: 620 };
     updateViewBox();
     updateZoomText();
  });

  function zoomCenter(factor) {
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    vb.w *= factor;
    vb.h *= factor;
    vb.x = cx - vb.w / 2;
    vb.y = cy - vb.h / 2;
    updateViewBox();
    updateZoomText();
  }
  
  function updateZoomText() {
     const zoomText = document.querySelector('span.font-mono.px-1');
     if (zoomText) {
       const percent = Math.round((1000 / vb.w) * 100);
       zoomText.textContent = `${percent}%`;
     }
  }
}

async function checkServicesHealth() {
  try {
    const res = await fetch(`${CONFIG.RESERVATION_API}/health`);
    state.isReservationApiLive = res.ok;
  } catch (e) {
    state.isReservationApiLive = false;
    console.warn("Reservation API is offline. Using mock data mode.");
  }
}

function cleanUpCenterCore(svg) {
  svg.querySelectorAll('path, polyline, line').forEach(el => el.remove());

  const coreBg = svg.querySelector('rect[fill="url(#coreGrad2)"]');
  if (coreBg) {
    coreBg.setAttribute('x', '420');
    coreBg.setAttribute('y', '220');
    coreBg.setAttribute('width', '160');
    coreBg.setAttribute('height', '180');
  }

  const texts = svg.querySelectorAll('text');
  texts.forEach(t => {
    if (t.textContent.includes('RDZEŃ / KUCHNIA & KAWA') || t.textContent.includes('STREFY CHILL')) {
      t.textContent = 'STREFY CHILL & KAWIARNIA';
      t.setAttribute('font-size', '10');
      t.setAttribute('x', '500');
      t.setAttribute('y', '312'); // idealnie po środku między windami
      t.setAttribute('text-anchor', 'middle');
    }
    if (t.textContent.includes('Ekspresy')) {
      t.setAttribute('x', '500');
      t.setAttribute('y', '336'); // proporcjonalnie w dół
      t.setAttribute('font-size', '9');
      t.setAttribute('text-anchor', 'middle');
    }
  });

  const allRects = svg.querySelectorAll('rect');
  allRects.forEach(r => {
    const fill = r.getAttribute('fill');
    const width = r.getAttribute('width');
    if (fill === '#11151c' || width === '50' || width === '40' || width === '36') {
      if (r.getAttribute('height') === '40' || r.getAttribute('height') === '50' || r.getAttribute('height') === '36') {
        const x = parseFloat(r.getAttribute('x'));
        const y = parseFloat(r.getAttribute('y'));
        if (!isNaN(x) && !isNaN(y) && (fill === '#11151c')) {
            const origX = width === '36' ? 500 + (x - 500) / 0.55 : (width === '40' ? 500 + (x - 500) / 0.7 : x);
            const origY = width === '36' ? 310 + (y - 310) / 0.55 : (width === '40' ? 310 + (y - 310) / 0.7 : y);

            const newX = 500 + (origX - 500) * 0.55; 
            const newY = 310 + (origY - 310) * 0.55;
            r.setAttribute('x', newX.toString());
            r.setAttribute('y', newY.toString());
            r.setAttribute('width', '36');
            r.setAttribute('height', '36');
            r.setAttribute('rx', '4');
        }
      }
    }
  });

  texts.forEach(t => {
    if (t.textContent.includes('Winda')) {
      const x = parseFloat(t.getAttribute('x'));
      const y = parseFloat(t.getAttribute('y'));
      if (!isNaN(x) && !isNaN(y)) {
        let origX = x;
        let origY = y;
        
        // Zabezpieczenie przed wielokrotnym przesuwaniem po odświeżeniu
        if (t.getAttribute('font-size') === '8') {
            origX = 500 + (x + 4 - 500) / 0.55;
            origY = 310 + (y + 4 - 310) / 0.55;
        }

        const newX = 500 + (origX - 500) * 0.55 - 4; 
        const newY = 310 + (origY - 310) * 0.55 - 4;
        t.setAttribute('x', newX.toString());
        t.setAttribute('y', newY.toString());
        t.setAttribute('font-size', '8');
      }
    }
  });

  const middleBorder = svg.querySelector('rect[stroke="#00e5ff"]');
  if (middleBorder) {
    middleBorder.setAttribute('x', '425');
    middleBorder.setAttribute('y', '298'); // przesunięte w dół by wycentrować z nowym tekstem
    middleBorder.setAttribute('width', '150');
    middleBorder.setAttribute('height', '22');
    middleBorder.setAttribute('rx', '4');
  }
}

function generate150Desks(svg) {
  // Rozszerzamy mapę w dół, aby uniknąć nakładania na "Salki Focus" i zwiększyć przestrzeń
  svg.setAttribute('viewBox', '0 0 1000 720');
  
  const bg1 = svg.querySelector('rect[fill="#0a0e16"]');
  if (bg1) bg1.setAttribute('height', '720');
  
  const bg2 = svg.querySelector('rect[fill="url(#office-grid)"]');
  if (bg2) bg2.setAttribute('height', '720');
  
  const border = svg.querySelector('polygon');
  if (border) border.setAttribute('points', '15,15 985,15 985,705 15,705');
  
  // Poszerzamy całą stronę, aby mapa była ogromna na szerokich monitorach
  const container = document.querySelector('.max-w-\\[1680px\\]');
  if (container) {
    container.classList.remove('max-w-[1680px]');
    container.classList.add('max-w-[95%]', 'px-8');
  }

  cleanUpCenterCore(svg);

  // Usuń stare ręcznie wstawione biurka oraz wywal Salki Focus
  const allGroups = svg.querySelectorAll('g');
  allGroups.forEach(g => {
    // Salki Focus
    const textEl1 = g.querySelector('text');
    if (textEl1 && (textEl1.textContent.includes('Salka Focus Alpha') || textEl1.textContent.includes('Salka Focus Beta'))) {
      g.remove();
      return; 
    }
    // Stare biurka
    const childGroup = Array.from(g.children).find(el => el.tagName === 'g');
    if (childGroup) {
      const textEl = Array.from(childGroup.children).find(el => el.tagName === 'text');
      if (textEl && textEl.textContent.match(/^[A-D]-\d{2}/)) {
        g.remove(); // Usuwamy cały rząd
      }
    }
  });

  const desksLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  desksLayer.id = 'desks-layer';
  
  // Bez salek, możemy użyć czystego układu po lewej (A/C) i prawej (B/D) stronie rdzenia (x: 400-600)
  const zones = [
    { prefix: 'A', count: 38, startX: 40, startY: 40 },
    { prefix: 'B', count: 38, startX: 640, startY: 40 },
    { prefix: 'C', count: 37, startX: 40, startY: 380 },
    { prefix: 'D', count: 37, startX: 640, startY: 380 }
  ];
  
  zones.forEach(zone => {
    let currentX = zone.startX;
    let currentY = zone.startY;
    let columns = 6;
    let colIndex = 0;
    
    for (let i = 1; i <= zone.count; i++) {
      
      const shortId = `${zone.prefix}-${i.toString().padStart(2, '0')}`;
      const deskId = `F${state.currentFloor}-${shortId}`;
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${currentX}, ${currentY})`);
      g.classList.add('map-resource', 'cursor-pointer');
      g.dataset.id = deskId;
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('fill', '#181c24');
      rect.setAttribute('height', '32');
      rect.setAttribute('rx', '4');
      rect.setAttribute('stroke', '#31353e');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('width', '50');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      g.appendChild(rect);
      
      if (i % 2 === 0) {
        const strip = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        strip.setAttribute('fill', '#849396');
        strip.setAttribute('height', '3');
        strip.setAttribute('rx', '1');
        strip.setAttribute('width', '16');
        strip.setAttribute('x', '20');
        strip.setAttribute('y', '5');
        g.appendChild(strip);
      }
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('fill', '#849396');
      text.setAttribute('font-family', 'JetBrains Mono');
      text.setAttribute('font-size', '9');
      text.setAttribute('font-weight', '500');
      text.setAttribute('x', '9');
      text.setAttribute('y', '25');
      text.textContent = shortId;
      g.appendChild(text);
      
      desksLayer.appendChild(g);
      
      // Przesuń kursor na następne pole
      colIndex++;
      currentX += 58;
      if (colIndex >= columns) {
        colIndex = 0;
        currentX = zone.startX;
        currentY += 46;
      }
    }
  });

  // Usuń starą warstwę jeśli istnieje (przy przełączaniu pięter)
  const oldLayer = svg.querySelector('#desks-layer');
  if (oldLayer) oldLayer.remove();

  // Wstawiamy wygenerowane biurka do SVG (np. przed salami konferencyjnymi)
  svg.insertBefore(desksLayer, svg.lastElementChild);
}

function initSVGMap() {
  const svg = document.querySelector('svg');
  if (!svg) {
    console.error('SVG not found!');
    return;
  }
  
  // Czyszczenie lokalnych zasobów z innych pięter
  state.resources = state.resources.filter(r => r.type !== 'desk' || r.floor === state.currentFloor);

  // Najpierw wygenerujmy pełną pulę 150 biurek
  generate150Desks(svg);
  
  const desks = svg.querySelectorAll('.map-resource');
  console.log('Total generated desks:', desks.length);
  
  desks.forEach(g => {
    const deskId = g.dataset.id;
    
    if (!state.resources.find(r => r.id === deskId)) {
      state.resources.push({
        id: deskId,
        floor: state.currentFloor,
        name: `Biurko ${deskId.split('-').slice(1).join('-')} (Piętro ${state.currentFloor})`,
        type: 'desk',
        zone: `Strefa ${deskId.split('-')[1]}`,
        capacity: 1,
        is_reserved: false,
        features: 'Standardowe wyposażenie, USB-C'
      });
    }
    
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Clicked desk:', deskId);
      selectResource(deskId);
    });
    
    g.addEventListener('mouseenter', () => {
      if (!g.dataset.reserved) {
        const rect = g.querySelector('rect');
        if (rect) rect.setAttribute('stroke', '#00e5ff');
      }
    });
    
    g.addEventListener('mouseleave', () => {
      updateDeskStyle(deskId);
    });
  });
  
  setTimeout(() => selectResource(`F${state.currentFloor}-D-14`), 500);
}

function initEventListeners() {
  const bookBtn = document.getElementById('quick-book-button');
  if (bookBtn) {
    bookBtn.addEventListener('click', handleCreateReservation);
  }

  // Obsługa wyboru piętra
  const floorSelect = document.querySelector('select');
  if (floorSelect) {
    floorSelect.innerHTML = '';
    for (let i = 1; i <= 100; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Piętro ${i}`;
      if (i === 42) option.textContent += ' • Labs & Focus';
      else if (i === 40) option.textContent += ' • Open Space';
      option.className = 'bg-surface-container text-on-surface';
      if (i === state.currentFloor) option.selected = true;
      floorSelect.appendChild(option);
    }
    
    floorSelect.addEventListener('change', (e) => {
      state.currentFloor = parseInt(e.target.value);
      state.selectedResourceId = null; // reset selekcji
      
      // Aktualizacja nagłówka z piętrem
      const floorTitle = document.querySelector('h1.font-headline-lg');
      if (floorTitle) floorTitle.textContent = `Wybierz i zarezerwuj biurko na piętrze ${state.currentFloor}`;
      
      const mapTitle = document.querySelector('span.font-label-lg.text-on-surface');
      if (mapTitle) mapTitle.textContent = `Plan Przestrzenny Piętra ${state.currentFloor}`;
      
      // Aktualizacja małego tagu (pill) nad tytułem
      const floorPill = document.querySelector('.bg-primary-container\\/20.text-primary-container.uppercase');
      if (floorPill) floorPill.textContent = `Piętro ${state.currentFloor} • Wieżowiec Główny`;
      
      initSVGMap(); // Regenerate desks with new IDs
      refreshData(); // Fetch backend data for new floor
      
      // Auto-wybór pierwszego biurka na nowym piętrze, aby odświeżyć panel boczny
      setTimeout(() => selectResource(`F${state.currentFloor}-D-14`), 500);
    });
  }

  const releaseBtn = document.querySelector('button.text-error');
  if (releaseBtn) {
    releaseBtn.addEventListener('click', handleReleaseReservation);
  }
}

async function refreshData() {
  if (state.isReservationApiLive) {
    try {
      const res = await fetch(`${CONFIG.RESERVATION_API}/api/resources?floor=${state.currentFloor}`);
      if (res.ok) {
        const backendResources = await res.json();
        // Zamiast nadpisywać wygenerowane biurka, aktualizujmy ich status
        backendResources.forEach(br => {
          const existing = state.resources.find(r => r.id === br.id);
          if (existing) {
            existing.is_reserved = br.is_reserved;
          } else {
            state.resources.push(br);
          }
        });
      }
      const resv = await fetch(`${CONFIG.RESERVATION_API}/api/reservations`);
      if (resv.ok) {
        state.reservations = await resv.json();
        
        // Aplikuj rezerwacje do naszych lokalnych zasobów z UI
        let myActiveResCount = 0;
        state.reservations.forEach(r => {
          if (r.status === 'CONFIRMED' || r.status === 'ACTIVE') {
            if (r.user_email === state.currentUser.email) {
               myActiveResCount++;
            }
            const uiRes = state.resources.find(ur => ur.id === r.resource_id);
            if (uiRes) uiRes.is_reserved = true;
          }
        });
        
        // Aktualizacja liczby rezerwacji w pasku bocznym (Badge)
        const sidebarBadge = document.querySelector('a[href="/reservations.html"] span:last-child');
        if (sidebarBadge) sidebarBadge.textContent = myActiveResCount;
      }
      
      updateActiveReservationCard();
    } catch (err) {
      console.warn("Błąd komunikacji z API:", err);
    }
  }
  
  // Zaktualizuj licznik wolnych biurek
  const desksCount = state.resources.filter(r => r.type === 'desk' && r.floor === state.currentFloor).length;
  const reservedCount = state.resources.filter(r => r.type === 'desk' && r.floor === state.currentFloor && r.is_reserved).length;
  const freeCount = desksCount - reservedCount;
  
  const freePill = document.querySelector('.bg-secondary-fixed\\/10.text-secondary');
  if (freePill) {
    freePill.textContent = `${freeCount} Wolne Biurka`;
  }
  
  // Zaktualizuj licznik po lewej w panelu
  const sidebarFree = document.querySelector('.bg-secondary-fixed\\/10.text-secondary.px-1\\.5');
  if (sidebarFree) {
    sidebarFree.textContent = `WOLNE ${freeCount}/${desksCount}`;
  }
  
  // Zaktualizuj overlay na mapie ze strefami
  updateZoneOverlays();

  renderMap();
}

function updateZoneOverlays() {
  const getZoneFreeCount = (prefix) => {
    return state.resources.filter(r => r.type === 'desk' && r.floor === state.currentFloor && r.id.includes(`-${prefix}-`) && !r.is_reserved).length;
  };
  
  const spans = document.querySelectorAll('.absolute.pointer-events-none.z-10 span:nth-child(2)');
  if (spans.length >= 4) {
    spans[0].textContent = `${getZoneFreeCount('A')} wolnych`;
    spans[1].textContent = `${getZoneFreeCount('B')} wolnych`;
    spans[2].textContent = `${getZoneFreeCount('C')} wolnych`;
    
    const deltaCount = getZoneFreeCount('D');
    // Jeżeli jesteśmy w Strefie D i mamy wybrane biurko, dodajmy to do opisu
    const selectedText = state.selectedResourceId && state.selectedResourceId.includes('-D-') ? ` (Wybrane ${state.selectedResourceId.split('-').slice(1).join('-')})` : '';
    spans[3].textContent = `${deltaCount} wolnych${selectedText}`;
  }
}

function renderMap() {
  state.resources.forEach(res => {
    updateDeskStyle(res.id);
  });
}

function updateDeskStyle(deskId) {
  const g = document.querySelector(`g[data-id="${deskId}"]`);
  if (!g) return;
  
  const res = state.resources.find(r => r.id === deskId);
  if (!res) return;
  
  const rects = g.querySelectorAll('rect');
  const text = g.querySelector('text');
  
  const isSelected = state.selectedResourceId === deskId;
  const isReserved = res.is_reserved;
  
  let isMyReservation = false;
  if (isReserved) {
    const activeRes = state.reservations.find(r => r.resource_id === deskId && (r.status === 'CONFIRMED' || r.status === 'ACTIVE'));
    if (activeRes && activeRes.user_email === state.currentUser.email) {
      isMyReservation = true;
    }
  }
  
  g.dataset.reserved = isReserved ? "true" : "";
  
  if (isSelected) {
    // Styl wybranego (zielony neon)
    if (rects[0]) {
      rects[0].setAttribute('fill', '#00210b');
      rects[0].setAttribute('stroke', '#62ff96');
      rects[0].setAttribute('stroke-width', '2.2');
    }
    if (text) {
      text.setAttribute('fill', '#62ff96');
      text.setAttribute('font-weight', 'bold');
    }
  } else if (isMyReservation) {
    // Moje zarezerwowane biurko (jasnozielony)
    if (rects[0]) {
      rects[0].setAttribute('fill', '#003918');
      rects[0].setAttribute('stroke', '#05e777');
      rects[0].setAttribute('stroke-width', '1.5');
    }
    if (text) {
      text.setAttribute('fill', '#05e777');
      text.setAttribute('font-weight', 'bold');
    }
  } else if (isReserved) {
    // Styl zajętego biurka (czerwony)
    if (rects[0]) {
      rects[0].setAttribute('fill', '#3d0004');
      rects[0].setAttribute('stroke', '#ffb4ab');
      rects[0].setAttribute('stroke-width', '1');
    }
    if (text) {
      text.setAttribute('fill', '#ffb4ab');
      text.setAttribute('font-weight', '500');
    }
  } else {
    // Styl wolnego biurka (ciemnoszary)
    if (rects[0]) {
      rects[0].setAttribute('fill', '#181c24');
      rects[0].setAttribute('stroke', '#31353e');
      rects[0].setAttribute('stroke-width', '1');
    }
    if (text) {
      text.setAttribute('fill', '#849396');
      text.setAttribute('font-weight', '500');
    }
  }
}

function selectResource(resourceId) {
  const previousId = state.selectedResourceId;
  state.selectedResourceId = resourceId;
  
  // Odśwież style na mapie
  if (previousId) updateDeskStyle(previousId);
  updateDeskStyle(resourceId);
  
  const res = state.resources.find(r => r.id === resourceId);
  if (!res) return;
  
  // Aktualizacja prawego panelu
  const titleEl = document.querySelector('h2.font-data-metric');
  if (titleEl) titleEl.textContent = res.name || `Biurko ${res.id}`;
  
  const zoneEl = titleEl?.nextElementSibling;
  if (zoneEl) zoneEl.textContent = res.zone || `Strefa ${res.id.charAt(0)}`;
  
  // Aktualizacja pillu "WOLNE OD ZARAZ" / "ZAJĘTE"
  const availabilityPill = document.querySelector('.bg-secondary-fixed\\/15.text-secondary-fixed') || document.querySelector('.bg-error\\/15.text-error');
  if (availabilityPill) {
    if (res.is_reserved) {
      availabilityPill.textContent = 'ZAJĘTE';
      availabilityPill.className = 'bg-error/15 text-error font-label-sm text-[11px] px-2.5 py-0.5 rounded font-bold';
    } else {
      availabilityPill.textContent = 'WOLNE OD ZARAZ';
      availabilityPill.className = 'bg-secondary-fixed/15 text-secondary-fixed font-label-sm text-[11px] px-2.5 py-0.5 rounded font-bold';
    }
  }
  
  const bookBtn = document.getElementById('quick-book-button');
  if (bookBtn) {
    if (res.is_reserved) {
      bookBtn.disabled = true;
      bookBtn.style.opacity = '0.5';
      bookBtn.querySelector('span:last-child').textContent = 'BIURKO ZAJĘTE';
    } else {
      bookBtn.disabled = false;
      bookBtn.style.opacity = '1';
      bookBtn.querySelector('span:last-child').textContent = 'ZAREZERWUJ TO BIURKO';
    }
  }
  
  updateZoneOverlays();
}

async function handleCreateReservation() {
  if (!state.selectedResourceId) return;
  
  const resourceId = state.selectedResourceId;
  const res = state.resources.find(r => r.id === resourceId);
  
  if (!res || res.is_reserved) return;
  
  const btn = document.getElementById('quick-book-button');
  const originalText = btn.querySelector('span:last-child').textContent;
  btn.querySelector('span:last-child').textContent = 'REZERWOWANIE...';
  
  // Zakładamy rezerwację na najbliższe 8 godzin
  const start = new Date();
  const end = new Date(start.getTime() + 8 * 3600000);
  
  if (state.isReservationApiLive) {
    try {
      const payload = {
        resource_id: resourceId,
        user_name: state.currentUser.name,
        user_email: state.currentUser.email,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        notes: "Szybka rezerwacja z panelu Aether Tower"
      };
      
      const response = await fetch(`${CONFIG.RESERVATION_API}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        // Natychmiast uaktualnij lokalnie aby UI było responsywne
        res.is_reserved = true;
        updateDeskStyle(resourceId);
        selectResource(resourceId);
        
        await refreshData();
        alert(`Sukces! Zarezerwowano ${resourceId}`);
      } else {
        alert('Błąd podczas rezerwacji.');
      }
    } catch (e) {
      alert('Błąd połączenia z API.');
    } finally {
      btn.querySelector('span:last-child').textContent = originalText;
    }
  } else {
    // Mock logic
    setTimeout(() => {
      res.is_reserved = true;
      updateDeskStyle(resourceId);
      selectResource(resourceId);
      alert(`[DEMO] Zarezerwowano ${resourceId} dla ${state.currentUser.name}!`);
      btn.querySelector('span:last-child').textContent = originalText;
    }, 600);
  }
}

function updateActiveReservationCard() {
  const cardContainer = document.querySelector('.bg-surface-container-low.shadow-md:last-child');
  if (!cardContainer) return;
  
  // Find all active reservations
  const activeReservations = state.reservations.filter(r => r.user_email === state.currentUser.email && r.status !== 'CANCELLED');
  
  // Keep the header, remove all inner blocks
  const header = cardContainer.querySelector('.flex.items-center.justify-between.pb-1');
  cardContainer.innerHTML = '';
  if (header) cardContainer.appendChild(header);
  
  if (activeReservations.length > 0) {
    activeReservations.forEach(r => {
      const deskId = r.resource_id;
      const floor = deskId.match(/F(\d+)/)?.[1] || '?';
      const shortDesk = deskId.split('-').slice(1).join('-');
      const zoneLetter = shortDesk.charAt(0);
      const zoneNames = {'A': 'Alpha', 'B': 'Beta', 'C': 'Gamma', 'D': 'Delta'};
      const zoneName = zoneNames[zoneLetter] || zoneLetter;
      
      const startDate = new Date(r.start_time);
      const endDate = new Date(r.end_time);
      const startStr = startDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      const endStr = endDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      
      const now = new Date();
      let timeRemainingText = '';
      if (endDate > now) {
        const diffMs = endDate - now;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.round((diffMs % 3600000) / 60000);
        timeRemainingText = `Pozostało: ${diffHrs}h ${diffMins}m`;
      } else {
        timeRemainingText = `Zakończona`;
      }
      
      const blockHTML = `
        <div class="flex flex-col gap-1 mb-2">
          <div class="bg-surface-container p-3 rounded-lg flex items-center justify-between border border-surface-variant/20">
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm text-primary font-bold">Biurko ${shortDesk}</span>
              <span class="font-body-sm text-[11px] text-on-surface-variant">Piętro ${floor} • Strefa ${zoneName}</span>
            </div>
            <button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-error font-label-sm text-[11px] transition-colors" onclick="cancelReservation(${r.id})">Zwolnij</button>
          </div>
          <div class="flex items-center justify-between text-body-sm text-[12px] text-on-surface-variant px-1">
            <span class="">Czas trwania: ${startStr} - ${endStr}</span>
            <span class="text-secondary font-medium">${timeRemainingText}</span>
          </div>
        </div>
      `;
      cardContainer.insertAdjacentHTML('beforeend', blockHTML);
    });
    
    const statusPill = header?.querySelector('span.bg-primary-container\\/20, span.bg-surface-variant\\/50');
    if (statusPill) {
      statusPill.textContent = activeReservations.length > 1 ? `${activeReservations.length} AKTYWNE` : 'AKTYWNA';
      statusPill.className = 'bg-primary-container/20 text-primary-container font-label-sm text-[10px] px-2 py-0.5 rounded font-bold';
    }
  } else {
    const blockHTML = `
      <div class="bg-surface-container p-3 rounded-lg flex items-center justify-between border border-surface-variant/20">
        <div class="flex flex-col">
          <span class="font-headline-sm text-headline-sm text-primary font-bold">Brak aktywnej rezerwacji</span>
          <span class="font-body-sm text-[11px] text-on-surface-variant">Wybierz biurko na mapie aby dokonać rezerwacji.</span>
        </div>
      </div>
    `;
    cardContainer.insertAdjacentHTML('beforeend', blockHTML);
    
    const statusPill = header?.querySelector('span.bg-primary-container\\/20, span.bg-surface-variant\\/50');
    if (statusPill) {
      statusPill.textContent = 'BRAK';
      statusPill.className = 'bg-surface-variant/50 text-on-surface-variant font-label-sm text-[10px] px-2 py-0.5 rounded font-bold';
    }
  }
}

// Ensure the cancel function is globally accessible for the inline onclick handlers
window.cancelReservation = async function(id) {
  try {
    const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations/${id}/cancel`, {
      method: 'POST'
    });
    if (res.ok) {
      alert('Pomyślnie zwolniono biurko!');
      await refreshData();
    } else {
      alert('Nie udało się zwolnić biurka.');
    }
  } catch (err) {
    console.error(err);
    alert('Błąd komunikacji z serwerem.');
  }
};

async function handleReleaseReservation() {
  if (!state.activeReservationId) return;
  
  const btn = document.querySelector('button.text-error');
  if (btn) btn.textContent = 'Zwalnianie...';
  
  try {
    const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations/${state.activeReservationId}/cancel`, {
      method: 'POST'
    });
    
    if (res.ok) {
      alert('Pomyślnie zwolniono biurko!');
      await refreshData();
    } else {
      alert('Nie udało się zwolnić biurka.');
    }
  } catch (err) {
    console.error(err);
    alert('Błąd komunikacji z serwerem.');
  } finally {
    if (btn) btn.textContent = 'Zwolnij biurko';
  }
}
