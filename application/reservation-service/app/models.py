import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Resource(Base):
    """Model zasobu biurowego (biurko, sala konferencyjna, miejsce parkingowe)."""

    __tablename__ = "resources"

    id = Column(String, primary_key=True, index=True)
    floor = Column(Integer, default=1, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, index=True)  # 'desk', 'room', 'parking'
    zone = Column(String, nullable=False)               # 'Strefa A', 'Strefa B', 'Sala spotkań', 'Parking'
    capacity = Column(Integer, default=1)
    description = Column(String, nullable=True)
    features = Column(String, nullable=True)           # Opis wyposażenia np. "Dual Monitor, Dok USB-C"
    is_active = Column(Boolean, default=True)

    reservations = relationship("Reservation", back_populates="resource", cascade="all, delete-orphan")


class Reservation(Base):
    """Model rezerwacji zasobu przez użytkownika."""

    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False, index=True)
    user_name = Column(String, nullable=False)
    user_email = Column(String, nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, default="CONFIRMED")  # 'CONFIRMED', 'CANCELLED'
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resource = relationship("Resource", back_populates="reservations")
