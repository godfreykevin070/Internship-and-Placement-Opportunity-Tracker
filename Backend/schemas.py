from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import date, datetime

# Student Schemas
class StudentBase(BaseModel):
    enrollment_number: str = Field(..., max_length=20)
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=15)
    date_of_birth: Optional[date] = None
    current_cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    department: Optional[str] = Field(None, max_length=50)
    academic_year: Optional[int] = Field(None, ge=1, le=6)
    resume_link: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    student_id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Company Schemas
class CompanyBase(BaseModel):
    company_name: str = Field(..., max_length=100)
    industry: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = None
    hr_contact_name: Optional[str] = Field(None, max_length=100)
    hr_contact_email: Optional[EmailStr] = None
    hr_contact_phone: Optional[str] = Field(None, max_length=15)
    company_size: Optional[str] = Field(None, max_length=20)
    founded_year: Optional[int] = Field(None, ge=1800, le=datetime.now().year)
    is_active: Optional[bool] = True

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    company_id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# InternshipOpportunity Schemas
class InternshipOpportunityBase(BaseModel):
    company_id: int
    title: str = Field(..., max_length=100)
    description: Optional[str] = None
    internship_type: str = Field(..., pattern="^(Summer|Winter|Semester|Year-Round)$")
    duration_weeks: Optional[int] = Field(None, ge=1)
    stipend_amount: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    remote_option: Optional[bool] = False
    application_deadline: Optional[date] = None
    start_date: Optional[date] = None
    max_applications: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = True
    
    @validator('start_date')
    def validate_dates(cls, v, values):
        if v and values.get('application_deadline') and v < values['application_deadline']:
            raise ValueError('start_date must be after application_deadline')
        return v

class InternshipOpportunityCreate(InternshipOpportunityBase):
    pass

class InternshipOpportunityResponse(InternshipOpportunityBase):
    opportunity_id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Application Schemas
class ApplicationBase(BaseModel):
    student_id: int
    opportunity_id: int
    cover_letter: Optional[str] = None
    status: Optional[str] = Field('Submitted', pattern="^(Submitted|Under Review|Shortlisted|Rejected|Selected|Offer Accepted|Offer Declined)$")
    applied_via: Optional[str] = Field(None, max_length=50)
    selection_round: Optional[str] = Field('Application', pattern="^(Application|Online Test|Technical Interview|HR Interview|Final)$")
    remarks: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    application_id: int
    application_date: Optional[datetime] = None
    last_status_update: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Skill Schemas
class SkillBase(BaseModel):
    skill_name: str = Field(..., max_length=50)
    category: Optional[str] = Field(None, max_length=50)

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    skill_id: int
    
    class Config:
        from_attributes = True

# Interview Schemas
class InterviewBase(BaseModel):
    application_id: int
    interview_date: datetime
    interview_type: str = Field(..., pattern="^(Online|In-Person|Phone)$")
    interviewer_name: Optional[str] = Field(None, max_length=100)
    interview_platform: Optional[str] = Field(None, max_length=50)
    duration_minutes: Optional[int] = Field(None, ge=1)
    feedback: Optional[str] = None
    score: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[str] = Field('Scheduled', pattern="^(Scheduled|Completed|Cancelled|Rescheduled)$")

class InterviewCreate(InterviewBase):
    pass

class InterviewResponse(InterviewBase):
    interview_id: int
    
    class Config:
        from_attributes = True

# EligibilityCriteria Schemas
class EligibilityCriteriaBase(BaseModel):
    opportunity_id: int
    min_cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    required_department: Optional[str] = Field(None, max_length=50)
    academic_year_required: Optional[int] = Field(None, ge=1, le=6)
    skills_required: Optional[str] = None
    backlogs_allowed: Optional[int] = Field(0, ge=0)

class EligibilityCriteriaCreate(EligibilityCriteriaBase):
    pass

class EligibilityCriteriaResponse(EligibilityCriteriaBase):
    criteria_id: int
    
    class Config:
        from_attributes = True

# Student_Skill Schemas
class StudentSkillBase(BaseModel):
    student_id: int
    skill_id: int
    proficiency_level: Optional[str] = Field('Intermediate', pattern="^(Beginner|Intermediate|Advanced|Expert)$")
    years_of_experience: Optional[float] = Field(None, ge=0)

class StudentSkillCreate(StudentSkillBase):
    pass

class StudentSkillResponse(StudentSkillBase):
    pass

# Opportunity_Skill Schemas
class OpportunitySkillBase(BaseModel):
    opportunity_id: int
    skill_id: int
    importance_level: Optional[str] = Field('Preferred', pattern="^(Required|Preferred|Optional)$")

class OpportunitySkillCreate(OpportunitySkillBase):
    pass

class OpportunitySkillResponse(OpportunitySkillBase):
    pass

# Dashboard Schemas
class DashboardStatistics(BaseModel):
    total_students: int
    total_companies: int
    total_opportunities: int
    active_opportunities: int
    total_applications: int
    applications_by_status: dict

class StudentApplicationDetail(BaseModel):
    application_id: int
    status: str
    application_date: Optional[datetime]
    opportunity: dict

class OpportunityApplicationDetail(BaseModel):
    application_id: int
    status: str
    student: dict