from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

USERNAME = os.getenv("USER_NAME")
PASSWORD = os.getenv("PASSWORD")
HOST_NAME = os.getenv("HOST_NAME")
PORT = os.getenv("PORT")
DATABASE_NAME = os.getenv("DATABASE_NAME", "InternshipTracker")

DATABASE_URL = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST_NAME}:{PORT}/{DATABASE_NAME}"

engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()