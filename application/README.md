# System Rezerwacji Zasobów i Przestrzeni Biurowej

Aplikacja oparta na architekturze mikrousług do zarządzania rezerwacjami zasobów biurowych (biurka, sale konferencyjne, miejsca parkingowe) z interaktywną mapą biura SVG.

---

## 📁 Struktura Projektu

```
application/
├── reservation-service/       # Backend: FastAPI + SQLAlchemy (PostgreSQL / SQLite)
│   ├── app/
│   │   ├── main.py            # Endpunkty REST API dla zasobów i rezerwacji
│   │   ├── database.py        # Połączenie z bazą danych (SQLAlchemy Engine)
│   │   └── models.py          # Modele danych (Resource, Reservation)
│   └── requirements.txt       # fastapi, uvicorn, psycopg2-binary, sqlalchemy
│
├── user-notification-service/ # Backend: FastAPI (Profile użytkowników i e-mail)
│   ├── app/
│   │   └── main.py            # Wysłanie e-mail (powiadomienia) i logi
│   └── requirements.txt
│
└── frontend/                  # Frontend: HTML5 + CSS3 + JavaScript (Mapa SVG)
    ├── index.html             # Interfejs aplikacji i mapa SVG biura
    ├── app.js                 # Integracja z API REST, interakcja SVG, fallback
    └── style.css              # Stylizacja Glassmorphism, animacje i motyw ciemny
```

---

## 🚀 Instrukcja Uruchomienia

### 1. Uruchomienie `reservation-service` (Port 8000)

```bash
cd application/reservation-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

*Domyślnie usługa korzysta z lokalnej bazy SQLite (`reservations.db`). Aby podłączyć bazę PostgreSQL, ustaw zmienną środowiskową:*
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/reservation_db"
```

### 2. Uruchomienie `user-notification-service` (Port 8001)

```bash
cd application/user-notification-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### 3. Uruchomienie `frontend`

Otwórz plik `application/frontend/index.html` bezpośrednio w przeglądarce internetowej lub uruchom serwer HTTP:

```bash
cd application/frontend
python -m http.server 3000
```

Przejdź do: `http://localhost:3000`

---

## 🛠️ Punkty Końcowe REST API

### `reservation-service` (`http://localhost:8000`)
- `GET /api/resources` - Pobranie listy zasobów (z zakresem dat i filtrowaniem)
- `GET /api/resources/{id}` - Pobranie szczegółów pojedynczego zasobu
- `GET /api/reservations` - Pobranie listy rezerwacji
- `POST /api/reservations` - Utworzenie nowej rezerwacji (sprawdza kolizje w czasie)
- `POST /api/reservations/{id}/cancel` - Anulowanie rezerwacji

### `user-notification-service` (`http://localhost:8001`)
- `GET /api/users/profiles` - Lista profili użytkowników
- `POST /api/notifications/send-email` - Wysyłka e-maila z potwierdzeniem rezerwacji
- `GET /api/notifications/logs` - Pobranie logów wysłanych powiadomień
