from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, DECIMAL
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

USERNAME = os.getenv("USER_NAME")
PASSWORD = os.getenv("PASSWORD")
HOST_NAME = os.getenv("HOST_NAME")
PORT = os.getenv("PORT")

DATABASE_URL = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST_NAME}:{PORT}/InternshipTracker"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

# ✅ Match DB table exactly
class Student(Base):
    __tablename__ = "Student"

    student_id = Column(Integer, primary_key=True, index=True)
    enrollment_number = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(100), unique=True)
    department = Column(String(50))
    current_cgpa = Column(DECIMAL(3,2))

# ✅ Request model
class StudentCreate(BaseModel):
    enrollment_number: str
    first_name: str
    last_name: str
    email: str
    department: str
    current_cgpa: float

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ GET all students
@app.get("/Student/")
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

# ✅ CREATE student
@app.post("/Student/")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    new_student = Student(**student.dict())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student