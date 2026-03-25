from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(200), nullable=False)
    original_name = Column(String(200), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(50), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    album_id = Column(Integer, ForeignKey("albums.id"), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    album = relationship("Album", back_populates="photos", foreign_keys=[album_id])
    uploader = relationship("User", foreign_keys=[uploader_id])
