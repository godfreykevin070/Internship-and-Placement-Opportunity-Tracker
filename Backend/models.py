from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, Text, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Department(Base):
    __tablename__ = "department"
    
    department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_code = Column(String(10), unique=True, nullable=False)
    department_name = Column(String(100), nullable=False)
    hod_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    students = relationship("Student", back_populates="department")
    eligibility_criteria = relationship("EligibilityCriteria", back_populates="department")

class Student(Base):
    __tablename__ = "student"
    
    student_id = Column(Integer, primary_key=True, autoincrement=True)
    enrollment_number = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(15), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    current_cgpa = Column(DECIMAL(3,2), nullable=True)
    department_id = Column(Integer, ForeignKey("department.department_id", ondelete="SET NULL"), nullable=True)
    academic_year = Column(Integer, nullable=True)
    resume_link = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    department = relationship("Department", back_populates="students")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_department', 'department_id'),
        Index('idx_cgpa', 'current_cgpa'),
        Index('idx_student_name', 'first_name', 'last_name'),
    )

class Company(Base):
    __tablename__ = "company"
    
    company_id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(100), unique=True, nullable=False)
    industry = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    hr_contact_name = Column(String(100), nullable=True)
    hr_contact_email = Column(String(100), nullable=True)
    hr_contact_phone = Column(String(15), nullable=True)
    company_size = Column(String(20), nullable=True)
    founded_year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    opportunities = relationship("InternshipOpportunity", back_populates="company", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_company_name', 'company_name'),
    )

class InternshipType(Base):
    __tablename__ = "internshiptype"
    
    type_id = Column(Integer, primary_key=True, autoincrement=True)
    type_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    opportunities = relationship("InternshipOpportunity", back_populates="internship_type")

class InternshipOpportunity(Base):
    __tablename__ = "internshipopportunity"
    
    opportunity_id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("company.company_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    internship_type_id = Column(Integer, ForeignKey("internshiptype.type_id"), nullable=False)
    duration_weeks = Column(Integer, nullable=True)
    stipend_amount = Column(DECIMAL(10,2), nullable=True)
    location = Column(String(100), nullable=True)
    remote_option = Column(Boolean, default=False)
    application_deadline = Column(Date, nullable=True)
    start_date = Column(Date, nullable=True)
    max_applications = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="opportunities")
    internship_type = relationship("InternshipType", back_populates="opportunities")
    eligibility_criteria = relationship("EligibilityCriteria", back_populates="opportunity", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="opportunity", cascade="all, delete-orphan")
    required_skills = relationship("OpportunitySkill", back_populates="opportunity", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_deadline', 'application_deadline'),
        Index('idx_opportunity_active', 'is_active', 'application_deadline'),
    )

class Skill(Base):
    __tablename__ = "skill"
    
    skill_id = Column(Integer, primary_key=True, autoincrement=True)
    skill_name = Column(String(50), unique=True, nullable=False)
    category = Column(String(50), nullable=True)
    
    # Relationships
    student_skills = relationship("StudentSkill", back_populates="skill", cascade="all, delete-orphan")
    opportunity_skills = relationship("OpportunitySkill", back_populates="skill", cascade="all, delete-orphan")
    eligibility_skills = relationship("EligibilitySkill", back_populates="skill", cascade="all, delete-orphan")

class EligibilityCriteria(Base):
    __tablename__ = "eligibilitycriteria"
    
    criteria_id = Column(Integer, primary_key=True, autoincrement=True)
    opportunity_id = Column(Integer, ForeignKey("internshipopportunity.opportunity_id", ondelete="CASCADE"), nullable=False)
    min_cgpa = Column(DECIMAL(3,2), nullable=True)
    required_department_id = Column(Integer, ForeignKey("department.department_id", ondelete="SET NULL"), nullable=True)
    academic_year_required = Column(Integer, nullable=True)
    backlogs_allowed = Column(Integer, default=0)
    
    # Relationships
    opportunity = relationship("InternshipOpportunity", back_populates="eligibility_criteria")
    department = relationship("Department", back_populates="eligibility_criteria")
    required_skills = relationship("EligibilitySkill", back_populates="criteria", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_min_cgpa', 'min_cgpa'),
    )

class EligibilitySkill(Base):
    __tablename__ = "eligibility_skill"
    
    criteria_id = Column(Integer, ForeignKey("eligibilitycriteria.criteria_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skill.skill_id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    criteria = relationship("EligibilityCriteria", back_populates="required_skills")
    skill = relationship("Skill", back_populates="eligibility_skills")

class ApplicationStatus(Base):
    __tablename__ = "applicationstatus"
    
    status_id = Column(Integer, primary_key=True, autoincrement=True)
    status_name = Column(String(50), unique=True, nullable=False)
    is_final = Column(Boolean, default=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    applications = relationship("Application", foreign_keys="Application.status_id", back_populates="status")

class SelectionRound(Base):
    __tablename__ = "selectionround"
    
    round_id = Column(Integer, primary_key=True, autoincrement=True)
    round_name = Column(String(50), unique=True, nullable=False)
    round_order = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    applications = relationship("Application", back_populates="selection_round")

class Application(Base):
    __tablename__ = "application"
    
    application_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("student.student_id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("internshipopportunity.opportunity_id", ondelete="CASCADE"), nullable=False)
    application_date = Column(DateTime, server_default=func.now())
    cover_letter = Column(Text, nullable=True)
    status_id = Column(Integer, ForeignKey("applicationstatus.status_id"), nullable=False, default=1)
    applied_via = Column(String(50), nullable=True)
    last_status_update = Column(DateTime, server_default=func.now(), onupdate=func.now())
    selection_round_id = Column(Integer, ForeignKey("selectionround.round_id"), nullable=False, default=1)
    remarks = Column(Text, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="applications")
    opportunity = relationship("InternshipOpportunity", back_populates="applications")
    status = relationship("ApplicationStatus", back_populates="applications")
    selection_round = relationship("SelectionRound", back_populates="applications")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'opportunity_id', name='unique_application'),
        Index('idx_status', 'status_id'),
        Index('idx_application_date', 'application_date'),
        Index('idx_application_status_date', 'status_id', 'application_date'),
    )

class ApplicationStatusHistory(Base):
    __tablename__ = "applicationstatushistory"
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("application.application_id", ondelete="CASCADE"), nullable=False)
    old_status_id = Column(Integer, ForeignKey("applicationstatus.status_id"), nullable=True)
    new_status_id = Column(Integer, ForeignKey("applicationstatus.status_id"), nullable=False)
    changed_by = Column(String(50), default="System")
    change_reason = Column(Text, nullable=True)
    changed_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    application = relationship("Application", back_populates="status_history")
    old_status = relationship("ApplicationStatus", foreign_keys=[old_status_id])
    new_status = relationship("ApplicationStatus", foreign_keys=[new_status_id])
    
    __table_args__ = (
        Index('idx_change_date', 'changed_at'),
    )

class InterviewType(Base):
    __tablename__ = "interviewtype"
    
    type_id = Column(Integer, primary_key=True, autoincrement=True)
    type_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    interviews = relationship("Interview", back_populates="interview_type")

class InterviewStatus(Base):
    __tablename__ = "interviewstatus"
    
    status_id = Column(Integer, primary_key=True, autoincrement=True)
    status_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    interviews = relationship("Interview", back_populates="status")

class Interview(Base):
    __tablename__ = "interview"
    
    interview_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("application.application_id", ondelete="CASCADE"), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    interview_type_id = Column(Integer, ForeignKey("interviewtype.type_id"), nullable=False)
    interviewer_name = Column(String(100), nullable=True)
    interview_platform = Column(String(50), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    score = Column(DECIMAL(5,2), nullable=True)
    status_id = Column(Integer, ForeignKey("interviewstatus.status_id"), nullable=False, default=1)
    
    # Relationships
    application = relationship("Application", back_populates="interviews")
    interview_type = relationship("InterviewType", back_populates="interviews")
    status = relationship("InterviewStatus", back_populates="interviews")
    
    __table_args__ = (
        Index('idx_interview_date', 'interview_date'),
        Index('idx_interview_status', 'status_id', 'interview_date'),
    )

class ProficiencyLevel(Base):
    __tablename__ = "proficiencylevel"
    
    level_id = Column(Integer, primary_key=True, autoincrement=True)
    level_name = Column(String(50), unique=True, nullable=False)
    sort_order = Column(Integer, nullable=True)
    
    # Relationships
    student_skills = relationship("StudentSkill", back_populates="proficiency_level")

class StudentSkill(Base):
    __tablename__ = "student_skill"
    
    student_id = Column(Integer, ForeignKey("student.student_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skill.skill_id", ondelete="CASCADE"), primary_key=True)
    proficiency_level_id = Column(Integer, ForeignKey("proficiencylevel.level_id"), nullable=False, default=2)
    years_of_experience = Column(DECIMAL(3,1), nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="skills")
    skill = relationship("Skill", back_populates="student_skills")
    proficiency_level = relationship("ProficiencyLevel", back_populates="student_skills")

class ImportanceLevel(Base):
    __tablename__ = "importancelevel"
    
    level_id = Column(Integer, primary_key=True, autoincrement=True)
    level_name = Column(String(50), unique=True, nullable=False)
    sort_order = Column(Integer, nullable=True)
    
    # Relationships
    opportunity_skills = relationship("OpportunitySkill", back_populates="importance_level")

class OpportunitySkill(Base):
    __tablename__ = "opportunity_skill"
    
    opportunity_id = Column(Integer, ForeignKey("internshipopportunity.opportunity_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skill.skill_id", ondelete="CASCADE"), primary_key=True)
    importance_level_id = Column(Integer, ForeignKey("importancelevel.level_id"), nullable=False, default=2)
    
    # Relationships
    opportunity = relationship("InternshipOpportunity", back_populates="required_skills")
    skill = relationship("Skill", back_populates="opportunity_skills")
    importance_level = relationship("ImportanceLevel", back_populates="opportunity_skills")