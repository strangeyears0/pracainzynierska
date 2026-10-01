import datetime
import os
import httpx
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Resource, Reservation

# Utworzenie tabel w bazie danych przy starcie
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Reservation Service API",
    description="Mikrousługa zarządzania rezerwacją zasobów (biurka, sale, miejsca parkingowe)",
    version="1.0.0",
)

# Konfiguracja CORS dla frontendu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:8001")

# --- Schematy Pydantic ---

class ResourceBase(BaseModel):
    id: str
    name: str
    type: str
    zone: str
    capacity: int = 1
    description: Optional[str] = None
    features: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class ReservationCreate(BaseModel):
    resource_id: str
    user_name: str
    user_email: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    notes: Optional[str] = None


class ReservationResponse(BaseModel):
    id: int
    resource_id: str
    user_name: str
    user_email: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ResourceStatusResponse(ResourceBase):
    is_reserved: bool = False
    current_reservation: Optional[ReservationResponse] = None


# --- Ziarno danych początkowych (Seeding) ---

def seed_initial_data(db: Session):
    if db.query(Resource).count() == 0:
        initial_resources = [
            # Zone A: Open Space Desks
            Resource(id="DESK-01", name="Biurko 01 (Strefa Cicha)", type="desk", zone="Strefa A", capacity=1, description="Biurko narożne z widokiem na ogród", features="Dual Monitor 27\", Dok USB-C, Regulowany fotel"),
            Resource(id="DESK-02", name="Biurko 02 (Open Space)", type="desk", zone="Strefa A", capacity=1, description="Standardowe stanowisko pracy", features="Monitor 4K, Dok USB-C"),
            Resource(id="DESK-03", name="Biurko 03 (Open Space)", type="desk", zone="Strefa A", capacity=1, description="Standardowe stanowisko pracy", features="Monitor 4K, Dok USB-C"),
            Resource(id="DESK-04", name="Biurko 04 (Open Space)", type="desk", zone="Strefa A", capacity=1, description="Stanowisko z ładowaniem bezprzewodowym", features="Monitor UltraWide 34\", Dok USB-C, Ładowarka Qi"),
            Resource(id="DESK-05", name="Biurko 05 (Strefa A)", type="desk", zone="Strefa A", capacity=1, description="Stanowisko przy oknie", features="Monitor 27\", Dok USB-C"),
            Resource(id="DESK-06", name="Biurko 06 (Strefa A)", type="desk", zone="Strefa A", capacity=1, description="Stanowisko przy oknie", features="Monitor 27\", Dok USB-C"),
            Resource(id="DESK-07", name="Biurko 07 (Strefa B)", type="desk", zone="Strefa B", capacity=1, description="Biurko z regulacją wysokości", features="Elektryczne biurko Stand-Up, Dual Monitor"),
            Resource(id="DESK-08", name="Biurko 08 (Strefa B)", type="desk", zone="Strefa B", capacity=1, description="Biurko z regulacją wysokości", features="Elektryczne biurko Stand-Up, Dual Monitor"),
            
            # Sale konferencyjne
            Resource(id="ROOM-A", name="Sala Alpha (Zarząd)", type="room", zone="Sale Spotkań", capacity=10, description="Reprezentacyjna sala konferencyjna", features="Projektor 4K, Wideokonferencja Polycom, Tablica dry-erase"),
            Resource(id="ROOM-B", name="Sala Beta (Warsztatowa)", type="room", zone="Sale Spotkań", capacity=6, description="Kreatywny pokój spotkań", features="Smart TV 65\", Flipchart, Nagłośnienie Bluetooth"),
            Resource(id="ROOM-C", name="Boks Fokus C", type="room", zone="Sale Spotkań", capacity=2, description="Akustyczna budka do cichych rozmów", features="Wygodne fotele, Oświetlenie LED, Dok USB"),

            # Miejsca parkingowe
            Resource(id="PARK-01", name="Miejsce P1 (Ładowarka EV)", type="parking", zone="Parking Podziemny", capacity=1, description="Miejsce z szybką ładowarką elektryczną", features="Stacja ładowania 22kW AC"),
            Resource(id="PARK-02", name="Miejsce P2", type="parking", zone="Parking Podziemny", capacity=1, description="Standardowe miejsce podziemne", features="Szerokie miejsce parkingowe"),
            Resource(id="PARK-03", name="Miejsce P3", type="parking", zone="Parking Podziemny", capacity=1, description="Standardowe miejsce podziemne", features="Blisko windy"),
            Resource(id="PARK-04", name="Miejsce P4", type="parking", zone="Parking Podziemny", capacity=1, description="Miejsce dla gości", features="Rezerwowane na godziny"),
        ]
        db.add_all(initial_resources)
        db.commit()


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


# --- Endpointy REST ---

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "reservation-service", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.get("/api/resources", response_model=List[ResourceStatusResponse])
def get_resources(
    type: Optional[str] = None,
    zone: Optional[str] = None,
    start_time: Optional[datetime.datetime] = None,
    end_time: Optional[datetime.datetime] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Resource).filter(Resource.is_active == True)
    if type:
        query = query.filter(Resource.type == type)
    if zone:
        query = query.filter(Resource.zone == zone)
    
    resources = query.all()
    
    # Określenie zakresu czasowego sprawdzania dostępności
    now = datetime.datetime.utcnow()
    check_start = start_time if start_time else now
    check_end = end_time if end_time else (check_start + datetime.timedelta(hours=8))

    results = []
    for r in resources:
        # Szukamy aktywnej rezerwacji pokrywającej się w czasie
        active_res = (
            db.query(Reservation)
            .filter(
                Reservation.resource_id == r.id,
                Reservation.status == "CONFIRMED",
                Reservation.start_time < check_end,
                Reservation.end_time > check_start,
            )
            .first()
        )

        res_dict = ResourceStatusResponse.from_orm(r)
        res_dict.is_reserved = active_res is not None
        if active_res:
            res_dict.current_reservation = ReservationResponse.from_orm(active_res)
        results.append(res_dict)

    return results


@app.get("/api/resources/{resource_id}", response_model=ResourceStatusResponse)
def get_resource(resource_id: str, db: Session = Depends(get_db)):
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Zasób nie został znaleziony")
    
    now = datetime.datetime.utcnow()
    active_res = (
        db.query(Reservation)
        .filter(
            Reservation.resource_id == res.id,
            Reservation.status == "CONFIRMED",
            Reservation.end_time > now,
        )
        .first()
    )

    result = ResourceStatusResponse.from_orm(res)
    result.is_reserved = active_res is not None
    if active_res:
        result.current_reservation = ReservationResponse.from_orm(active_res)
    return result


@app.get("/api/reservations", response_model=List[ReservationResponse])
def list_reservations(
    user_email: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: Optional[str] = "CONFIRMED",
    db: Session = Depends(get_db),
):
    query = db.query(Reservation)
    if user_email:
        query = query.filter(Reservation.user_email == user_email)
    if resource_id:
        query = query.filter(Reservation.resource_id == resource_id)
    if status:
        query = query.filter(Reservation.status == status)
    
    return query.order_by(Reservation.start_time.desc()).all()


@app.post("/api/reservations", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(payload: ReservationCreate, db: Session = Depends(get_db)):
    # Sprawdzenie czy zasób istnieje
    resource = db.query(Resource).filter(Resource.id == payload.resource_id, Resource.is_active == True).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Wskazany zasób nie istnieje lub jest nieaktywny")

    # Sprawdzenie poprawności dat
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="Czas końcowy musi być późniejszy niż czas początkowy")

    # Sprawdzenie kolizji terminów
    overlap = (
        db.query(Reservation)
        .filter(
            Reservation.resource_id == payload.resource_id,
            Reservation.status == "CONFIRMED",
            Reservation.start_time < payload.end_time,
            Reservation.end_time > payload.start_time,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=409,
            detail=f"Zasób {payload.resource_id} jest już zarezerwowany w wybranym terminie ({overlap.start_time.strftime('%Y-%m-%d %H:%M')} - {overlap.end_time.strftime('%H:%M')})"
        )

    reservation = Reservation(
        resource_id=payload.resource_id,
        user_name=payload.user_name,
        user_email=payload.user_email,
        start_time=payload.start_time,
        end_time=payload.end_time,
        notes=payload.notes,
        status="CONFIRMED",
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    # Wysłanie powiadomienia e-mail (asynchronicznie wywołujemy user-notification-service)
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/notifications/send-email",
                json={
                    "recipient_email": reservation.user_email,
                    "recipient_name": reservation.user_name,
                    "subject": f"Potwierdzenie rezerwacji: {resource.name}",
                    "message": (
                        f"Witaj {reservation.user_name}!\n\n"
                        f"Twoja rezerwacja dla {resource.name} ({resource.id}) została pomyślnie utworzona.\n"
                        f"Termin: {reservation.start_time.strftime('%Y-%m-%d %H:%M')} do {reservation.end_time.strftime('%Y-%m-%d %H:%M')}.\n"
                        f"Lokalizacja: {resource.zone}.\n\n"
                        f"Dziękujemy za korzystanie z naszego systemu rezerwacji!"
                    ),
                    "reservation_id": reservation.id,
                },
            )
    except Exception as e:
        print(f"[WARN] Nie udało się wysłać powiadomienia e-mail: {e}")

    return reservation


@app.post("/api/reservations/{reservation_id}/cancel", response_model=ReservationResponse)
async def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Rezerwacja nie została znaleziona")

    if reservation.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Rezerwacja została już wcześniej anulowana")

    reservation.status = "CANCELLED"
    db.commit()
    db.refresh(reservation)

    # Wysyłamy powiadomienie o anulowaniu rezerwacji
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/notifications/send-email",
                json={
                    "recipient_email": reservation.user_email,
                    "recipient_name": reservation.user_name,
                    "subject": f"Anulowanie rezerwacji #{reservation.id}",
                    "message": f"Rezerwacja #{reservation.id} dla zasobu {reservation.resource_id} została pomyślnie anulowana.",
                    "reservation_id": reservation.id,
                },
            )
    except Exception as e:
        print(f"[WARN] Nie udało się wysłać powiadomienia e-mail: {e}")

    return reservation
