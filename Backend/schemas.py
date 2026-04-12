from pydantic import BaseModel, Field, EmailStr, ConfigDict
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

# Department Schemas
class DepartmentBase(BaseModel):
    department_code: str = Field(..., max_length=10)
    department_name: str = Field(..., max_length=100)
    hod_name: Optional[str] = Field(None, max_length=100)

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    department_id: int
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Student Schemas
class StudentBase(BaseModel):
    enrollment_number: str = Field(..., max_length=20)
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: EmailStr = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=15)
    date_of_birth: Optional[date] = None
    current_cgpa: Optional[Decimal] = Field(None, ge=0, le=10)
    department_id: Optional[int] = None
    academic_year: Optional[int] = None
    resume_link: Optional[str] = Field(None, max_length=255)

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    enrollment_number: Optional[str] = Field(None, max_length=20)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=15)
    date_of_birth: Optional[date] = None
    current_cgpa: Optional[Decimal] = Field(None, ge=0, le=10)
    department_id: Optional[int] = None
    academic_year: Optional[int] = None
    resume_link: Optional[str] = Field(None, max_length=255)

class StudentResponse(StudentBase):
    student_id: int
    created_at: Optional[datetime] = None
    department: Optional[DepartmentResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

# Company Schemas
class CompanyBase(BaseModel):
    company_name: str = Field(..., max_length=100)
    industry: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    hr_contact_name: Optional[str] = Field(None, max_length=100)
    hr_contact_email: Optional[EmailStr] = Field(None, max_length=100)
    hr_contact_phone: Optional[str] = Field(None, max_length=15)
    company_size: Optional[str] = Field(None, max_length=20)
    founded_year: Optional[int] = None
    is_active: Optional[bool] = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    hr_contact_name: Optional[str] = Field(None, max_length=100)
    hr_contact_email: Optional[EmailStr] = Field(None, max_length=100)
    hr_contact_phone: Optional[str] = Field(None, max_length=15)
    company_size: Optional[str] = Field(None, max_length=20)
    founded_year: Optional[int] = None
    is_active: Optional[bool] = None

class CompanyResponse(CompanyBase):
    company_id: int
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Skill Schemas
class SkillBase(BaseModel):
    skill_name: str = Field(..., max_length=50)
    category: Optional[str] = Field(None, max_length=50)

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    skill_id: int
    
    model_config = ConfigDict(from_attributes=True)

# Internship Opportunity Schemas
class InternshipOpportunityBase(BaseModel):
    company_id: int
    title: str = Field(..., max_length=100)
    description: Optional[str] = None
    internship_type_id: int
    duration_weeks: Optional[int] = None
    stipend_amount: Optional[Decimal] = None
    location: Optional[str] = Field(None, max_length=100)
    remote_option: Optional[bool] = False
    application_deadline: Optional[date] = None
    start_date: Optional[date] = None
    max_applications: Optional[int] = None
    is_active: Optional[bool] = True

class InternshipOpportunityCreate(InternshipOpportunityBase):
    pass

class InternshipOpportunityUpdate(BaseModel):
    company_id: Optional[int] = None
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    internship_type_id: Optional[int] = None
    duration_weeks: Optional[int] = None
    stipend_amount: Optional[Decimal] = None
    location: Optional[str] = Field(None, max_length=100)
    remote_option: Optional[bool] = None
    application_deadline: Optional[date] = None
    start_date: Optional[date] = None
    max_applications: Optional[int] = None
    is_active: Optional[bool] = None

class InternshipOpportunityResponse(InternshipOpportunityBase):
    opportunity_id: int
    created_at: Optional[datetime] = None
    company: Optional[CompanyResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

# Application Schemas
class ApplicationBase(BaseModel):
    student_id: int
    opportunity_id: int
    cover_letter: Optional[str] = None
    applied_via: Optional[str] = Field(None, max_length=50)
    remarks: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status_id: Optional[int] = None
    selection_round_id: Optional[int] = None
    remarks: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    application_id: int
    application_date: Optional[datetime] = None
    status_id: int
    last_status_update: Optional[datetime] = None
    selection_round_id: int
    student: Optional[StudentResponse] = None
    opportunity: Optional[InternshipOpportunityResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

# Application Status Update Schemas
class ApplicationStatusUpdate(BaseModel):
    new_status_name: str = Field(..., max_length=50)
    change_reason: Optional[str] = None
    changed_by: str = Field(default="System", max_length=50)

# Eligibility Criteria Schemas
class EligibilityCriteriaBase(BaseModel):
    opportunity_id: int
    min_cgpa: Optional[Decimal] = Field(None, ge=0, le=10)
    required_department_id: Optional[int] = None
    academic_year_required: Optional[int] = None
    backlogs_allowed: Optional[int] = 0

class EligibilityCriteriaCreate(EligibilityCriteriaBase):
    required_skill_ids: Optional[List[int]] = []

class EligibilityCriteriaResponse(EligibilityCriteriaBase):
    criteria_id: int
    required_skills: Optional[List[SkillResponse]] = []
    
    model_config = ConfigDict(from_attributes=True)

# Student Skill Schemas
class StudentSkillCreate(BaseModel):
    skill_id: int
    proficiency_level_id: int = 2
    years_of_experience: Optional[Decimal] = None

class StudentSkillResponse(BaseModel):
    skill: SkillResponse
    proficiency_level_id: int
    years_of_experience: Optional[Decimal] = None

# Interview Schemas
class InterviewBase(BaseModel):
    application_id: int
    interview_date: datetime
    interview_type_id: int
    interviewer_name: Optional[str] = Field(None, max_length=100)
    interview_platform: Optional[str] = Field(None, max_length=50)
    duration_minutes: Optional[int] = None
    feedback: Optional[str] = None
    score: Optional[Decimal] = None
    status_id: int = 1

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    interview_date: Optional[datetime] = None
    interview_type_id: Optional[int] = None
    interviewer_name: Optional[str] = None
    interview_platform: Optional[str] = None
    duration_minutes: Optional[int] = None
    feedback: Optional[str] = None
    score: Optional[Decimal] = None
    status_id: Optional[int] = None

class InterviewResponse(InterviewBase):
    interview_id: int
    
    model_config = ConfigDict(from_attributes=True)

# Eligibility Check Schemas
class EligibilityCheckRequest(BaseModel):
    student_id: int
    opportunity_id: int

class EligibilityCheckResponse(BaseModel):
    is_eligible: bool
    student_name: str
    opportunity_title: str
    student_cgpa: Decimal
    min_cgpa_required: Optional[Decimal] = None
    department_match: bool
    missing_skills: List[str] = []
    message: str