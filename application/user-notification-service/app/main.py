import datetime
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

app = FastAPI(
    title="User & Notification Service API",
    description="Mikrousługa obsługi profili użytkowników oraz wysyłki powiadomień e-mail",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pamięciowa baza danych profili użytkowników i logów powiadomień
USER_PROFILES: Dict[str, dict] = {
    "jan.kowalski@firma.pl": {
        "email": "jan.kowalski@firma.pl",
        "full_name": "Jan Kowalski",
        "department": "Dział IT / Software",
        "phone": "+48 600 100 200",
        "role": "Senior Developer",
        "avatar": "JK",
    },
    "anna.nowak@firma.pl": {
        "email": "anna.nowak@firma.pl",
        "full_name": "Anna Nowak",
        "department": "Dział HR & Talent",
        "phone": "+48 600 300 400",
        "role": "HR Manager",
        "avatar": "AN",
    },
    "piotr.wisniewski@firma.pl": {
        "email": "piotr.wisniewski@firma.pl",
        "full_name": "Piotr Wiśniewski",
        "department": "Dział Projektowania UX/UI",
        "phone": "+48 600 500 600",
        "role": "Lead Designer",
        "avatar": "PW",
    },
}

NOTIFICATION_LOGS: List[dict] = []

# --- Schematy Pydantic ---

class UserProfile(BaseModel):
    email: EmailStr
    full_name: str
    department: Optional[str] = "Ogólny"
    phone: Optional[str] = None
    role: Optional[str] = "Pracownik"
    avatar: Optional[str] = "U"


class EmailNotificationRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: str
    subject: str
    message: str
    reservation_id: Optional[int] = None


class NotificationLogResponse(BaseModel):
    id: int
    recipient_email: str
    recipient_name: str
    subject: str
    message: str
    reservation_id: Optional[int] = None
    sent_at: str
    status: str


# --- Endpointy REST ---

@app.get("/")
def read_root():
    """Przekierowanie z głównego adresu URL do interaktywnej dokumentacji OpenAPI Swagger."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "user-notification-service", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.get("/api/users/profiles", response_model=List[UserProfile])
def list_user_profiles():
    return list(USER_PROFILES.values())


@app.get("/api/users/profile/{email}", response_model=UserProfile)
def get_user_profile(email: str):
    profile = USER_PROFILES.get(email.lower())
    if not profile:
        # Generujemy profil domyślny, jeśli użytkownik jeszcze nie istnieje
        parts = email.split("@")[0].split(".")
        full_name = " ".join([p.capitalize() for p in parts]) if len(parts) > 1 else email.capitalize()
        profile = {
            "email": email.lower(),
            "full_name": full_name,
            "department": "Inżynieria",
            "phone": "+48 500 000 000",
            "role": "Użytkownik Systemu",
            "avatar": full_name[:2].upper() if len(full_name) >= 2 else "U",
        }
        USER_PROFILES[email.lower()] = profile
    return profile


@app.post("/api/users/profile", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def create_or_update_profile(profile: UserProfile):
    data = profile.dict()
    USER_PROFILES[profile.email.lower()] = data
    return profile


@app.post("/api/notifications/send-email", status_code=status.HTTP_200_OK)
def send_email_notification(req: EmailNotificationRequest):
    log_id = len(NOTIFICATION_LOGS) + 1
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    log_entry = {
        "id": log_id,
        "recipient_email": req.recipient_email,
        "recipient_name": req.recipient_name,
        "subject": req.subject,
        "message": req.message,
        "reservation_id": req.reservation_id,
        "sent_at": timestamp,
        "status": "DELIVERED (SIMULATED)",
    }
    
    NOTIFICATION_LOGS.insert(0, log_entry)

    # Drukowanie w logach konsoli usługi dla celów demonstracyjnych
    print(f"==================================================")
    print(f"[EMAIL SERVICE] Wysyłanie e-mail do: {req.recipient_email}")
    print(f"Temat: {req.subject}")
    print(f"Treść:\n{req.message}")
    print(f"==================================================")

    return {
        "success": True,
        "message": f"Wiadomość e-mail do {req.recipient_email} została wysłana.",
        "log_id": log_id,
    }


@app.get("/api/notifications/logs", response_model=List[NotificationLogResponse])
def get_notification_logs(email: Optional[str] = None):
    if email:
        return [log for log in NOTIFICATION_LOGS if log["recipient_email"].lower() == email.lower()]
    return NOTIFICATION_LOGS
