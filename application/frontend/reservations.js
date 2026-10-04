const CONFIG = {
  RESERVATION_API: 'http://localhost:8000'
};

const state = {
  currentUser: {
    id: "EMP-8892",
    name: "Mateusz Thorne",
    email: "mateusz.thorne@aethertower.pl"
  },
  reservations: [],
  activeReservation: null
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("Reservations View - Initializing...");
  fetchReservations();
  
  const releaseBtn = document.getElementById('hero-release-btn');
  if (releaseBtn) {
    releaseBtn.addEventListener('click', handleReleaseReservation);
  }
});

async function fetchReservations() {
  try {
    const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations`);
    if (res.ok) {
      const allRes = await res.json();
      state.reservations = allRes.filter(r => r.user_email === state.currentUser.email && r.status !== 'CANCELLED');
      
      // Znajdź aktywną / dzisiejszą rezerwację
      state.activeReservation = state.reservations.find(r => r.status === 'ACTIVE' || r.status === 'CONFIRMED');
      
      updateLiveSessionCard();
      updateUpcomingReservations();
      updateKPIs();
    }
  } catch (err) {
    console.warn("Błąd komunikacji z API:", err);
    document.getElementById('upcoming-reservations-list').innerHTML = `
      <div class="bg-error-container/20 text-error p-4 text-center rounded-xl font-label-sm text-[12px]">
        Błąd połączenia z serwerem.
      </div>
    `;
  }
}

function updateLiveSessionCard() {
  const card = document.getElementById('live-session-card');
  if (!card) return;
  
  if (state.activeReservation) {
    card.style.display = 'block';
    
    const r = state.activeReservation;
    const deskId = r.resource_id;
    const floor = deskId.match(/F(\d+)/)?.[1] || '?';
    const shortDesk = deskId.split('-').slice(1).join('-');
    const zoneLetter = shortDesk.charAt(0);
    const zoneNames = {'A': 'ALPHA', 'B': 'BETA', 'C': 'GAMMA', 'D': 'DELTA'};
    const zoneName = zoneNames[zoneLetter] || zoneLetter;
    
    document.getElementById('live-desk-title').textContent = `Biurko ${shortDesk}`;
    document.getElementById('live-floor-tag').textContent = `PIĘTRO ${floor}`;
    document.getElementById('live-zone-tag').textContent = `STREFA ${zoneName}`;
    document.getElementById('live-mini-desk').textContent = `${shortDesk} (TY)`;
    document.getElementById('live-mini-sector').textContent = `Sektor ${zoneLetter} // P${floor}`;
    
    // Zaktualizuj KPI dla aktywnej rezerwacji
    const kpiActiveDesk = document.getElementById('kpi-active-desk');
    if (kpiActiveDesk) kpiActiveDesk.textContent = `Biurko ${shortDesk} • P${floor}`;
    
    const kpiActiveCount = document.getElementById('kpi-active-count');
    if (kpiActiveCount) kpiActiveCount.textContent = '1 STANOWISKO';
  } else {
    card.style.display = 'none';
    
    const kpiActiveCount = document.getElementById('kpi-active-count');
    if (kpiActiveCount) kpiActiveCount.textContent = 'BRAK';
    
    const kpiActiveDesk = document.getElementById('kpi-active-desk');
    if (kpiActiveDesk) kpiActiveDesk.textContent = '-';
  }
}

function updateUpcomingReservations() {
  const listContainer = document.getElementById('upcoming-reservations-list');
  if (!listContainer) return;
  
  // Pomijamy tę, która jest aktualnie aktywna na głównym ekranie
  const upcoming = state.reservations.filter(r => r.id !== state.activeReservation?.id);
  
  if (upcoming.length === 0) {
    listContainer.innerHTML = `
      <div class="bg-surface-container-low text-on-surface-variant p-4 text-center rounded-xl font-label-sm text-[12px] border border-surface-variant/20">
        Brak nadchodzących rezerwacji.
      </div>
    `;
    return;
  }
  
  listContainer.innerHTML = '';
  
  upcoming.forEach(r => {
    const startDate = new Date(r.start_time);
    const endDate = new Date(r.end_time);
    
    const day = startDate.getDate();
    const months = ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'];
    const month = months[startDate.getMonth()];
    
    const startTimeStr = startDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const diffMs = endDate - startDate;
    const diffHrs = Math.round(diffMs / 3600000);
    
    const deskId = r.resource_id;
    const floor = deskId.match(/F(\d+)/)?.[1] || '?';
    const shortDesk = deskId.split('-').slice(1).join('-');
    const zoneLetter = shortDesk.charAt(0);
    const zoneNames = {'A': 'Alpha', 'B': 'Beta', 'C': 'Gamma', 'D': 'Delta'};
    const zoneName = zoneNames[zoneLetter] || zoneLetter;
    
    const html = `
      <div class="bg-surface-container-low hover:bg-surface-container rounded-xl p-space-md transition-colors flex flex-col md:flex-row md:items-center justify-between gap-space-md group">
        <div class="flex items-start gap-space-md">
          <div class="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center shrink-0 text-center font-mono">
            <span class="text-[16px] text-on-surface font-bold leading-none">${day}</span>
            <span class="text-[9px] text-outline uppercase">${month}</span>
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-headline-sm text-[16px] text-on-surface font-semibold">Biurko ${shortDesk} • Strefa ${zoneName}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-label-sm font-bold bg-secondary/15 text-secondary uppercase">${r.status}</span>
            </div>
            <div class="flex items-center gap-space-md text-on-surface-variant text-body-sm flex-wrap">
              <span class="flex items-center gap-1 font-mono text-[12px]">
                <span class="material-symbols-outlined text-[15px] text-surface-tint">schedule</span>
                ${startTimeStr} - ${endTimeStr} (${diffHrs}h)
              </span>
              <span class="flex items-center gap-1 font-mono text-[12px]">
                <span class="material-symbols-outlined text-[15px] text-surface-tint">apartment</span>
                Piętro ${floor}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button class="px-space-sm py-1.5 rounded-lg text-error hover:bg-error-container/20 font-label-sm text-[11px] font-semibold transition-colors" type="button" onclick="cancelUpcoming(${r.id})">
            Anuluj
          </button>
        </div>
      </div>
    `;
    listContainer.insertAdjacentHTML('beforeend', html);
  });
}

function updateKPIs() {
  const count = state.reservations.length;
  
  // Update sidebar badge
  const sidebarBadge = document.querySelector('a[href="/reservations.html"] span:last-child');
  if (sidebarBadge) sidebarBadge.textContent = count;
  
  // Update main header badge
  const titleBadge = document.querySelector('h1 span.bg-surface-container-high');
  if (titleBadge) titleBadge.textContent = `${count} POZYCJ${count === 1 ? 'A' : (count > 1 && count < 5 ? 'E' : 'I')}`;

  const upcomingCount = document.getElementById('kpi-upcoming-count');
  if (upcomingCount) {
    const upcoming = count - (state.activeReservation ? 1 : 0);
    upcomingCount.textContent = `${upcoming} REZERWACJ${upcoming === 1 ? 'A' : (upcoming > 1 && upcoming < 5 ? 'E' : 'I')}`;
  }
}

async function handleReleaseReservation() {
  if (!state.activeReservation) return;
  
  const btn = document.getElementById('hero-release-btn');
  if (btn) btn.textContent = 'Zwalnianie...';
  
  try {
    const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations/${state.activeReservation.id}/cancel`, {
      method: 'POST'
    });
    
    if (res.ok) {
      alert('Pomyślnie zwolniono biurko!');
      await fetchReservations();
    } else {
      alert('Nie udało się zwolnić biurka.');
    }
  } catch (err) {
    console.error(err);
    alert('Błąd komunikacji z serwerem.');
  } finally {
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">logout</span> Zwolnij biurko wcześniej';
  }
}

window.cancelUpcoming = async function(id) {
  if (confirm("Czy na pewno chcesz anulować tę rezerwację?")) {
    try {
      const res = await fetch(`${CONFIG.RESERVATION_API}/api/reservations/${id}/cancel`, { method: 'POST' });
      if (res.ok) {
        await fetchReservations();
      } else {
        alert("Błąd podczas anulowania.");
      }
    } catch (e) {
      alert("Błąd połączenia z API.");
    }
  }
};
