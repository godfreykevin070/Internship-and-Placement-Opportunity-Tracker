from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import services
from database import get_db

# Student Router
student_router = APIRouter()

@student_router.get("/students/", response_model=List[schemas.StudentResponse])
def get_students(db: Session = Depends(get_db)):
    return services.StudentService.get_all(db)

@student_router.get("/students/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = services.StudentService.get_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@student_router.post("/students/", response_model=schemas.StudentResponse, status_code=201)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    return services.StudentService.create(db, student)

@student_router.put("/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)):
    updated_student = services.StudentService.update(db, student_id, student)
    if not updated_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated_student

@student_router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    deleted = services.StudentService.delete(db, student_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

@student_router.get("/students/{student_id}/eligible-opportunities")
def get_eligible_opportunities(student_id: int, db: Session = Depends(get_db)):
    opportunities = services.StudentService.get_eligible_opportunities(db, student_id)
    if opportunities is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return opportunities

@student_router.get("/students/{student_id}/applications")
def get_student_applications(student_id: int, db: Session = Depends(get_db)):
    applications = services.StudentService.get_applications(db, student_id)
    if applications is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return applications

# Company Router
company_router = APIRouter()

@company_router.get("/companies/", response_model=List[schemas.CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    return services.CompanyService.get_all(db)

@company_router.get("/companies/{company_id}", response_model=schemas.CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = services.CompanyService.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@company_router.post("/companies/", response_model=schemas.CompanyResponse, status_code=201)
def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db)):
    return services.CompanyService.create(db, company)

# Opportunity Router
opportunity_router = APIRouter()

@opportunity_router.get("/opportunities/", response_model=List[schemas.InternshipOpportunityResponse])
def get_opportunities(db: Session = Depends(get_db)):
    return services.OpportunityService.get_all(db)

@opportunity_router.get("/opportunities/{opportunity_id}", response_model=schemas.InternshipOpportunityResponse)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = services.OpportunityService.get_by_id(db, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity

@opportunity_router.post("/opportunities/", response_model=schemas.InternshipOpportunityResponse, status_code=201)
def create_opportunity(opportunity: schemas.InternshipOpportunityCreate, db: Session = Depends(get_db)):
    return services.OpportunityService.create(db, opportunity)

@opportunity_router.get("/opportunities/{opportunity_id}/applications")
def get_opportunity_applications(opportunity_id: int, db: Session = Depends(get_db)):
    applications = services.OpportunityService.get_applications(db, opportunity_id)
    if applications is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return applications

# Application Router
application_router = APIRouter()

@application_router.get("/applications/", response_model=List[schemas.ApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    return services.ApplicationService.get_all(db)

@application_router.get("/applications/{application_id}", response_model=schemas.ApplicationResponse)
def get_application(application_id: int, db: Session = Depends(get_db)):
    application = services.ApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@application_router.post("/applications/", response_model=schemas.ApplicationResponse, status_code=201)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    new_application = services.ApplicationService.create(db, application)
    if not new_application:
        raise HTTPException(status_code=400, detail="You have already applied for this opportunity")
    return new_application

@application_router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    new_status: str,
    change_reason: str = None,
    db: Session = Depends(get_db)
):
    result = services.ApplicationService.update_status(db, application_id, new_status, change_reason)
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    return result

# Skill Router
skill_router = APIRouter()

@skill_router.get("/skills/", response_model=List[schemas.SkillResponse])
def get_skills(db: Session = Depends(get_db)):
    return services.SkillService.get_all(db)

@skill_router.post("/skills/", response_model=schemas.SkillResponse, status_code=201)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    return services.SkillService.create(db, skill)

# Interview Router
interview_router = APIRouter()

@interview_router.get("/interviews/", response_model=List[schemas.InterviewResponse])
def get_interviews(db: Session = Depends(get_db)):
    return services.InterviewService.get_all(db)

@interview_router.post("/interviews/", response_model=schemas.InterviewResponse, status_code=201)
def create_interview(interview: schemas.InterviewCreate, db: Session = Depends(get_db)):
    new_interview = services.InterviewService.create(db, interview)
    if not new_interview:
        raise HTTPException(status_code=404, detail="Application not found")
    return new_interview

# Eligibility Router
eligibility_router = APIRouter()

@eligibility_router.get("/eligibility/", response_model=List[schemas.EligibilityCriteriaResponse])
def get_eligibility_criteria(db: Session = Depends(get_db)):
    return services.EligibilityService.get_all(db)

@eligibility_router.post("/eligibility/", response_model=schemas.EligibilityCriteriaResponse, status_code=201)
def create_eligibility_criteria(criteria: schemas.EligibilityCriteriaCreate, db: Session = Depends(get_db)):
    new_criteria = services.EligibilityService.create(db, criteria)
    if not new_criteria:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return new_criteria

# Student Skill Router
student_skill_router = APIRouter()

@student_skill_router.post("/student-skills/", response_model=schemas.StudentSkillResponse, status_code=201)
def add_student_skill(student_skill: schemas.StudentSkillCreate, db: Session = Depends(get_db)):
    new_student_skill = services.StudentSkillService.create(db, student_skill)
    if not new_student_skill:
        raise HTTPException(status_code=400, detail="Student already has this skill")
    return new_student_skill

# Opportunity Skill Router
opportunity_skill_router = APIRouter()

@opportunity_skill_router.post("/opportunity-skills/", response_model=schemas.OpportunitySkillResponse, status_code=201)
def add_opportunity_skill(opp_skill: schemas.OpportunitySkillCreate, db: Session = Depends(get_db)):
    new_opp_skill = services.OpportunitySkillService.create(db, opp_skill)
    if not new_opp_skill:
        raise HTTPException(status_code=400, detail="Opportunity already has this skill")
    return new_opp_skill

# Dashboard Router
dashboard_router = APIRouter()

@dashboard_router.get("/dashboard/statistics", response_model=schemas.DashboardStatistics)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    return services.DashboardService.get_statistics(db)