import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Domyślnie używa lokalnej bazy SQLite, jeśli zmienna środowiskowa DATABASE_URL nie jest ustawiona.
# Dostęp do bazy PostgreSQL: export DATABASE_URL="postgresql://user:password@localhost:5432/reservation_db"
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "sqlite:///./reservations.db"
)

# Connect args są potrzebne dla SQLite (check_same_thread)
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Zwraca sesję bazy danych dla wstrzykiwania zależności w FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
