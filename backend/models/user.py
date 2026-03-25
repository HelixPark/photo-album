from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    avatar = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    albums = relationship("Album", back_populates="owner", cascade="all, delete-orphan")
