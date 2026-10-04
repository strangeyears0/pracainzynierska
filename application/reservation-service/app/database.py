import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Domyślnie używa lokalnej bazy SQLite, jeśli zmienne PostgreSQL / DATABASE_URL nie są ustawione.
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT", "5432")
db_name = os.getenv("DB_NAME")

if os.getenv("DATABASE_URL"):
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
elif db_user and db_password and db_host and db_name:
    SQLALCHEMY_DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./reservations.db"

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
