/**
 * SYSTEM REZERWACJI ZASOBÓW BIUROWECH - FRONTEND APP LOGIC
 * Interaktywna mapa SVG & integracja z mikrousługami FastAPI
 */

const CONFIG = {
  RESERVATION_API: 'http://localhost:8000',
  NOTIFICATION_API: 'http://localhost:8001',
};

// Lokalny stan podręczny i mock na wypadek braku uruchomienia backendu
let state = {
  isReservationApiLive: false,
  isNotificationApiLive: false,
  selectedResourceId: null,
  activeCategoryFilter: 'all',
  resources: [
    { id: 'DESK-01', name: 'Biurko 01 (Strefa Cicha)', type: 'desk', zone: 'Strefa A', capacity: 1, is_reserved: false, features: 'Dual Monitor 27", Dok USB-C' },
    { id: 'DESK-02', name: 'Biurko 02 (Open Space)', type: 'desk', zone: 'Strefa A', capacity: 1, is_reserved: false, features: 'Monitor 4K, Dok USB-C' },
    { id: 'DESK-03', name: 'Biurko 03 (Open Space)', type: 'desk', zone: 'Strefa A', capacity: 1, is_reserved: false, features: 'Monitor 4K, Dok USB-C' },
    { id: 'DESK-04', name: 'Biurko 04 (Open Space)', type: 'desk', zone: 'Strefa A', capacity: 1, is_reserved: false, features: 'Monitor UltraWide 34", Ładowarka Qi' },
    { id: 'DESK-05', name: 'Biurko 05 (Strefa A)', type: 'desk', zone: 'Strefa A', capacity: 1, is_reserved: false, features: 'Monitor 27", Dok USB-C' },
    { id: 'DESK-06', name: 'Biurko 06 (Strefa A)', type: 'desk', zone: 'Strefa A', capacity: 1, is_reserved: false, features: 'Monitor 27", Dok USB-C' },
    { id: 'DESK-07', name: 'Biurko 07 (Strefa B)', type: 'desk', zone: 'Strefa B', capacity: 1, is_reserved: false, features: 'Elektryczne Stand-Up, Dual Monitor' },
    { id: 'DESK-08', name: 'Biurko 08 (Strefa B)', type: 'desk', zone: 'Strefa B', capacity: 1, is_reserved: false, features: 'Elektryczne Stand-Up, Dual Monitor' },
    { id: 'ROOM-A', name: 'Sala Alpha (Zarząd)', type: 'room', zone: 'Sale Spotkań', capacity: 10, is_reserved: false, features: 'Projektor 4K, Wideokonferencja' },
    { id: 'ROOM-B', name: 'Sala Beta (Warsztatowa)', type: 'room', zone: 'Sale Spotkań', capacity: 6, is_reserved: false, features: 'Smart TV 65", Flipchart' },
    { id: 'ROOM-C', name: 'Boks Fokus C', type: 'room', zone: 'Sale Spotkań', capacity: 2, is_reserved: false, features: 'Budka akustyczna, Dok USB' },
    { id: 'PARK-01', name: 'Miejsce P1 (Ładowarka EV)', type: 'parking', zone: 'Parking Podziemny', capacity: 1, is_reserved: false, features: 'Ładowarka 22kW AC' },
    { id: 'PARK-02', name: 'Miejsce P2', type: 'parking', zone: 'Parking Podziemny', capacity: 1, is_reserved: false, features: 'Szerokie miejsce podziemne' },
    { id: 'PARK-03', name: 'Miejsce P3', type: 'parking', zone: 'Parking Podziemny', capacity: 1, is_reserved: false, features: 'Blisko windy' },
    { id: 'PARK-04', name: 'Miejsce P4', type: 'parking', zone: 'Parking Podziemny', capacity: 1, is_reserved: false, features: 'Miejsce dla gości' },
  ],
  reservations: [],
  notifications: [],
  currentUser: {
    name: 'Jan Kowalski',
    email: 'jan.kowalski@firma.pl',
  }
};

// Domyślne inicjalizacje po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
  initDateTimeDefaults();
  initEventListeners();
  checkServicesHealth();
  refreshData();
});

// Ustawienie domyślnych dat w formularzach
function initDateTimeDefaults() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filter-date').value = today;

  const now = new Date();
  const startIso = new Date(now.getTime() + 10 * 60000).toISOString().slice(0, 16);
  const endIso = new Date(now.getTime() + 4 * 3600000).toISOString().slice(0, 16);

  document.getElementById('form-start-datetime').value = startIso;
  document.getElementById('form-end-datetime').value = endIso;
}

// Sprawdzenie dostępności usług REST API
async function checkServicesHealth() {
  // Check Reservation API
  try {
    const res = await fetch(`${CONFIG.RESERVATION_API}/health`, { method: 'GET' });
    if (res.ok) {
      state.isReservationApiLive = true;
      document.getElementById('dot-res-service').classList.add('online');
    }
  } catch (e) {
    state.isReservationApiLive = false;
    document.getElementById('dot-res-service').classList.remove('online');
  }

  // Check Notification API
  try {
    const notifRes = await fetch(`${CONFIG.NOTIFICATION_API}/health`, { method: 'GET' });
    if (notifRes.ok) {
      state.isNotificationApiLive = true;
      document.getElementById('dot-notif-service').classList.add('online');
    }
  } catch (e) {
    state.isNotificationApiLive = false;
    document.getElementById('dot-notif-service').classList.remove('online');
  }
}

// Główna funkcja odświeżania danych (z API lub lokalnych)
async function refreshData() {
  if (state.isReservationApiLive) {
    try {
      const res = await fetch(`${CONFIG.RESERVATION_API}/api/resources`);
      if (res.ok) {
        state.resources = await res.json();
      }
      const resv = await fetch(`${CONFIG.RESERVATION_API}/api/reservations`);
      if (resv.ok) {
        state.reservations = await resv.json();
      }
    } catch (err) {
      console.warn("Błąd komunikacji z API:", err);
    }
  }

  if (state.isNotificationApiLive) {
    try {
      const notifRes = await fetch(`${CONFIG.NOTIFICATION_API}/api/notifications/logs`);
      if (notifRes.ok) {
        state.notifications = await notifRes.json();
      }
    } catch (err) {
      console.warn("Błąd pobierania logów e-mail:", err);
    }
  }

  renderMap();
  renderStats();
  renderMyReservationsTable();
  renderNotificationsTable();
}

// Rejestracja zdarzeń interfejsu
function initEventListeners() {
  // Przełączanie użytkowników
  const userSelect = document.getElementById('user-select');
  userSelect.addEventListener('change', (e) => {
    const email = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text.split(' (')[0];
    const avatar = name.split(' ').map(n => n[0]).join('');

    state.currentUser = { name, email };
    document.getElementById('current-user-avatar').textContent = avatar;
    document.getElementById('form-user-name').value = name;
    document.getElementById('form-user-email').value = email;

    renderMyReservationsTable();
    showToast(`Przełączono profil na: ${name}`);
  });

  // Filtry kategorii
  const filterBtns = document.querySelectorAll('.btn-filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategoryFilter = btn.dataset.category;
      renderMap();
    });
  });

  // Obsługa kliknięć na mapie SVG
  const svgMap = document.getElementById('office-map-svg');
  const tooltip = document.getElementById('map-tooltip');

  document.querySelectorAll('.map-resource').forEach(elem => {
    const resourceId = elem.dataset.id;

    // Hover tooltip
    elem.addEventListener('mousemove', (e) => {
      const res = state.resources.find(r => r.id === resourceId);
      if (!res) return;

      const viewportRect = document.getElementById('svg-viewport').getBoundingClientRect();
      const x = e.clientX - viewportRect.left + 15;
      const y = e.clientY - viewportRect.top + 15;

      const statusText = res.is_reserved ? '🔴 ZAREZERWOWANE' : '🟢 WOLNE';

      tooltip.innerHTML = `
        <strong>${res.name}</strong>
        <div>Typ: ${res.type.toUpperCase()} &bull; ${res.zone}</div>
        <div>Status: ${statusText}</div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${res.features || ''}</div>
      `;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.classList.add('visible');
    });

    elem.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    // Selection
    elem.addEventListener('click', () => {
      selectResource(resourceId);
    });
  });

  // Wysyłanie formularza rezerwacji
  const form = document.getElementById('reservation-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleCreateReservation();
  });

  // Obsługa Tabów
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.add('active');
    });
  });
}

// Zaznaczenie zasobu na mapie i uzupełnienie panelu
function selectResource(resourceId) {
  state.selectedResourceId = resourceId;
  const res = state.resources.find(r => r.id === resourceId);
  if (!res) return;

  // Visual highlight na SVG
  document.querySelectorAll('.map-resource').forEach(el => el.classList.remove('selected'));
  const targetSvgElem = document.getElementById(`svg-${resourceId}`);
  if (targetSvgElem) targetSvgElem.classList.add('selected');

  // Wypełnienie panelu bocznego
  document.getElementById('form-resource-id').value = res.id;
  document.getElementById('res-detail-name').textContent = `${res.name} (${res.id})`;
  document.getElementById('res-detail-zone').textContent = `${res.zone} • Pojemność: ${res.capacity} os.`;

  // Ikona typu
  const iconMap = { desk: '💻', room: '🏛️', parking: '🚗' };
  document.getElementById('res-detail-icon').textContent = iconMap[res.type] || '📍';

  // Wyposażenie
  const featContainer = document.getElementById('res-features-container');
  featContainer.innerHTML = '';
  if (res.features) {
    res.features.split(',').forEach(feat => {
      const tag = document.createElement('span');
      tag.className = 'feature-tag';
      tag.textContent = feat.trim();
      featContainer.appendChild(tag);
    });
  }

  // Włączenie przycisku submit
  const btnSubmit = document.getElementById('btn-submit-reservation');
  if (res.is_reserved) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Zasób jest już zarezerwowany';
  } else {
    btnSubmit.disabled = false;
    btnSubmit.textContent = `Zarezerwuj ${res.id}`;
  }
}

// Tworzenie nowej rezerwacji
async function handleCreateReservation() {
  const resourceId = document.getElementById('form-resource-id').value;
  const userName = document.getElementById('form-user-name').value;
  const userEmail = document.getElementById('form-user-email').value;
  const startTime = document.getElementById('form-start-datetime').value;
  const endTime = document.getElementById('form-end-datetime').value;
  const notes = document.getElementById('form-notes').value;

  if (!resourceId) {
    showToast('Wybierz najpierw zasób z mapy SVG!');
    return;
  }

  const payload = {
    resource_id: resourceId,
    user_name: userName,
    user_email: userEmail,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(endTime).toISOString(),
    notes: notes,
  };

  if (state.isReservationApiLive) {
    try {
      const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`✅ Utworzono rezerwację dla ${resourceId}! Powiadomienie e-mail zostało wysłane.`);
        await refreshData();
      } else {
        const errorData = await res.json();
        showToast(`❌ Błąd: ${errorData.detail || 'Nie można utworzyć rezerwacji'}`);
      }
    } catch (err) {
      showToast(`❌ Błąd połączenia z API: ${err.message}`);
    }
  } else {
    // Fallback: symulacja w przeglądarce
    const newResv = {
      id: state.reservations.length + 1,
      resource_id: resourceId,
      user_name: userName,
      user_email: userEmail,
      start_time: startTime.replace('T', ' '),
      end_time: endTime.replace('T', ' '),
      status: 'CONFIRMED',
      notes: notes,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    state.reservations.unshift(newResv);

    // Oznaczenie jako reserved w stanie lokalnym
    const targetRes = state.resources.find(r => r.id === resourceId);
    if (targetRes) targetRes.is_reserved = true;

    // Dodanie logu powiadomienia email
    state.notifications.unshift({
      id: state.notifications.length + 1,
      recipient_email: userEmail,
      recipient_name: userName,
      subject: `Potwierdzenie rezerwacji: ${resourceId}`,
      message: `Rezerwacja zasobu ${resourceId} na dzień ${startTime.replace('T', ' ')} została potwierdzona.`,
      sent_at: new Date().toLocaleString(),
      status: 'DELIVERED (LOCAL MOCK)',
    });

    showToast(`✅ [Tryb Demo] Rezerwacja dla ${resourceId} została utworzona!`);
    renderMap();
    renderStats();
    renderMyReservationsTable();
    renderNotificationsTable();
    selectResource(resourceId);
  }
}

// Anulowanie rezerwacji
async function cancelReservation(reservationId) {
  if (state.isReservationApiLive) {
    try {
      const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast(`Rezerwacja #${reservationId} została anulowana.`);
        await refreshData();
      } else {
        const err = await res.json();
        showToast(`❌ Błąd: ${err.detail}`);
      }
    } catch (err) {
      showToast(`❌ Błąd połączenia: ${err.message}`);
    }
  } else {
    // Fallback
    const resv = state.reservations.find(r => r.id === reservationId);
    if (resv) {
      resv.status = 'CANCELLED';
      const rItem = state.resources.find(r => r.id === resv.resource_id);
      if (rItem) rItem.is_reserved = false;

      state.notifications.unshift({
        id: state.notifications.length + 1,
        recipient_email: resv.user_email,
        recipient_name: resv.user_name,
        subject: `Anulowanie rezerwacji #${reservationId}`,
        message: `Rezerwacja dla ${resv.resource_id} została anulowana.`,
        sent_at: new Date().toLocaleString(),
        status: 'DELIVERED (LOCAL MOCK)',
      });

      showToast(`Rezerwacja #${reservationId} została anulowana.`);
      renderMap();
      renderStats();
      renderMyReservationsTable();
      renderNotificationsTable();
    }
  }
}

// Renderowanie stanu elementów SVG na mapie
function renderMap() {
  state.resources.forEach(res => {
    const elem = document.getElementById(`svg-${res.id}`);
    if (!elem) return;

    // Filtrowanie kategorii
    if (state.activeCategoryFilter !== 'all' && res.type !== state.activeCategoryFilter) {
      elem.style.display = 'none';
    } else {
      elem.style.display = '';
    }

    // Ustawienie atrybutu statusu
    const status = res.is_reserved ? 'reserved' : 'available';
    elem.setAttribute('data-status', status);
  });
}

// Renderowanie statystyk w panelu
function renderStats() {
  const availableCount = state.resources.filter(r => !r.is_reserved).length;
  const reservedCount = state.resources.filter(r => r.is_reserved).length;

  document.getElementById('stat-count-available').textContent = availableCount;
  document.getElementById('stat-count-reserved').textContent = reservedCount;
}

// Renderowanie tabeli z rezerwacjami
function renderMyReservationsTable() {
  const tbody = document.getElementById('reservations-table-body');
  tbody.innerHTML = '';

  const userResv = state.reservations.filter(
    r => r.user_email.toLowerCase() === state.currentUser.email.toLowerCase()
  );

  if (userResv.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Brak aktywnych rezerwacji dla ${state.currentUser.email}. Wybierz zasób z mapy SVG!</td></tr>`;
    return;
  }

  userResv.forEach(resv => {
    const tr = document.createElement('tr');

    const statusBadge = resv.status === 'CONFIRMED'
      ? `<span class="badge-status confirmed">POTWIERDZONA</span>`
      : `<span class="badge-status cancelled">ANULOWANA</span>`;

    const cancelBtn = resv.status === 'CONFIRMED'
      ? `<button class="btn-cancel" onclick="cancelReservation(${resv.id})">Anuluj</button>`
      : `<span style="color: var(--text-dim); font-size: 0.75rem;">Brak akcji</span>`;

    const startFormatted = typeof resv.start_time === 'string' ? resv.start_time.replace('T', ' ').slice(0, 16) : resv.start_time;
    const endFormatted = typeof resv.end_time === 'string' ? resv.end_time.replace('T', ' ').slice(0, 16) : resv.end_time;

    tr.innerHTML = `
      <td><strong>#${resv.id}</strong></td>
      <td><strong style="color: var(--primary-cyan);">${resv.resource_id}</strong></td>
      <td>${resv.user_name} (${resv.user_email})</td>
      <td>${startFormatted}</td>
      <td>${endFormatted}</td>
      <td>${statusBadge}</td>
      <td>${resv.notes || '-'}</td>
      <td>${cancelBtn}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Renderowanie tabeli z logami wysyłki e-mail
function renderNotificationsTable() {
  const tbody = document.getElementById('notifications-table-body');
  tbody.innerHTML = '';

  if (state.notifications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Brak logów powiadomień. Rezerwacja wygeneruje wpis.</td></tr>`;
    return;
  }

  state.notifications.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${log.id}</td>
      <td>${log.recipient_name} &lt;${log.recipient_email}&gt;</td>
      <td><strong>${log.subject}</strong></td>
      <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 300px;">${log.message.replace(/\n/g, ' ')}</td>
      <td>${log.sent_at}</td>
      <td><span class="badge-status confirmed">${log.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Wyświetlanie powiadomień Toast
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
