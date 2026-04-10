from sqlalchemy import Column, Integer, String, DECIMAL, Text, Boolean, Date, DateTime, Enum, ForeignKey, TIMESTAMP, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "Student"
    
    student_id = Column(Integer, primary_key=True, autoincrement=True)
    enrollment_number = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(15))
    date_of_birth = Column(Date)
    current_cgpa = Column(DECIMAL(3,2))
    department = Column(String(50))
    academic_year = Column(Integer)
    resume_link = Column(String(255))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    skills = relationship("Student_Skill", back_populates="student", cascade="all, delete-orphan")

class Company(Base):
    __tablename__ = "Company"
    
    company_id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(100), unique=True, nullable=False)
    industry = Column(String(50))
    website = Column(String(255))
    hr_contact_name = Column(String(100))
    hr_contact_email = Column(String(100))
    hr_contact_phone = Column(String(15))
    company_size = Column(String(20))
    founded_year = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    opportunities = relationship("InternshipOpportunity", back_populates="company", cascade="all, delete-orphan")

class InternshipOpportunity(Base):
    __tablename__ = "InternshipOpportunity"
    
    opportunity_id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("Company.company_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    internship_type = Column(Enum('Summer', 'Winter', 'Semester', 'Year-Round'), nullable=False)
    duration_weeks = Column(Integer)
    stipend_amount = Column(DECIMAL(10,2))
    location = Column(String(100))
    remote_option = Column(Boolean, default=False)
    application_deadline = Column(Date)
    start_date = Column(Date)
    max_applications = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="opportunities")
    applications = relationship("Application", back_populates="opportunity", cascade="all, delete-orphan")
    eligibility_criteria = relationship("EligibilityCriteria", back_populates="opportunity", cascade="all, delete-orphan", uselist=False)
    skills = relationship("Opportunity_Skill", back_populates="opportunity", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "Skill"
    
    skill_id = Column(Integer, primary_key=True, autoincrement=True)
    skill_name = Column(String(50), unique=True, nullable=False)
    category = Column(String(50))
    
    students = relationship("Student_Skill", back_populates="skill", cascade="all, delete-orphan")
    opportunities = relationship("Opportunity_Skill", back_populates="skill", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "Department"
    
    department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_code = Column(String(10), unique=True, nullable=False)
    department_name = Column(String(100), nullable=False)
    hod_name = Column(String(100))

class EligibilityCriteria(Base):
    __tablename__ = "EligibilityCriteria"
    
    criteria_id = Column(Integer, primary_key=True, autoincrement=True)
    opportunity_id = Column(Integer, ForeignKey("InternshipOpportunity.opportunity_id", ondelete="CASCADE"), nullable=False)
    min_cgpa = Column(DECIMAL(3,2))
    required_department = Column(String(50))
    academic_year_required = Column(Integer)
    skills_required = Column(Text)
    backlogs_allowed = Column(Integer, default=0)
    
    opportunity = relationship("InternshipOpportunity", back_populates="eligibility_criteria")

class Application(Base):
    __tablename__ = "Application"
    
    application_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("Student.student_id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("InternshipOpportunity.opportunity_id", ondelete="CASCADE"), nullable=False)
    application_date = Column(TIMESTAMP, default=datetime.utcnow)
    cover_letter = Column(Text)
    status = Column(Enum('Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Selected', 'Offer Accepted', 'Offer Declined'), default='Submitted')
    applied_via = Column(String(50))
    last_status_update = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    selection_round = Column(Enum('Application', 'Online Test', 'Technical Interview', 'HR Interview', 'Final'), default='Application')
    remarks = Column(Text)
    
    __table_args__ = (
        UniqueConstraint('student_id', 'opportunity_id', name='unique_application'),
    )
    
    student = relationship("Student", back_populates="applications")
    opportunity = relationship("InternshipOpportunity", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")

class ApplicationStatusHistory(Base):
    __tablename__ = "ApplicationStatusHistory"
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("Application.application_id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50))
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(50), default='System')
    change_reason = Column(Text)
    changed_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    application = relationship("Application", back_populates="status_history")

class Interview(Base):
    __tablename__ = "Interview"
    
    interview_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("Application.application_id", ondelete="CASCADE"), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    interview_type = Column(Enum('Online', 'In-Person', 'Phone'), nullable=False)
    interviewer_name = Column(String(100))
    interview_platform = Column(String(50))
    duration_minutes = Column(Integer)
    feedback = Column(Text)
    score = Column(DECIMAL(5,2))
    status = Column(Enum('Scheduled', 'Completed', 'Cancelled', 'Rescheduled'), default='Scheduled')
    
    application = relationship("Application", back_populates="interviews")

class Student_Skill(Base):
    __tablename__ = "Student_Skill"
    
    student_id = Column(Integer, ForeignKey("Student.student_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("Skill.skill_id", ondelete="CASCADE"), primary_key=True)
    proficiency_level = Column(Enum('Beginner', 'Intermediate', 'Advanced', 'Expert'), default='Intermediate')
    years_of_experience = Column(DECIMAL(3,1))
    
    student = relationship("Student", back_populates="skills")
    skill = relationship("Skill", back_populates="students")

class Opportunity_Skill(Base):
    __tablename__ = "Opportunity_Skill"
    
    opportunity_id = Column(Integer, ForeignKey("InternshipOpportunity.opportunity_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("Skill.skill_id", ondelete="CASCADE"), primary_key=True)
    importance_level = Column(Enum('Required', 'Preferred', 'Optional'), default='Preferred')
    
    opportunity = relationship("InternshipOpportunity", back_populates="skills")
    skill = relationship("Skill", back_populates="opportunities")