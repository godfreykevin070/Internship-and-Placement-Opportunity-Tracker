from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, services
from database import get_db

router = APIRouter()

# ==================== Department Routes ====================
@router.post("/departments/", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    return services.DepartmentService.create_department(db, department)

@router.get("/departments/", response_model=List[schemas.DepartmentResponse])
def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.DepartmentService.get_departments(db, skip=skip, limit=limit)

@router.get("/departments/{department_id}", response_model=schemas.DepartmentResponse)
def get_department(department_id: int, db: Session = Depends(get_db)):
    department = services.DepartmentService.get_department(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.put("/departments/{department_id}", response_model=schemas.DepartmentResponse)
def update_department(department_id: int, department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    updated = services.DepartmentService.update_department(db, department_id, department)
    if not updated:
        raise HTTPException(status_code=404, detail="Department not found")
    return updated

@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    deleted = services.DepartmentService.delete_department(db, department_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Department not found")

# ==================== Student Routes ====================
@router.post("/students/", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    existing = services.StudentService.get_student_by_email(db, student.email)
    if existing:
        raise HTTPException(status_code=400, detail="Student with this email already exists")
    return services.StudentService.create_student(db, student)

@router.get("/students/", response_model=List[schemas.StudentResponse])
def get_students(
    skip: int = 0, 
    limit: int = 100, 
    department_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return services.StudentService.get_students(db, skip=skip, limit=limit, department_id=department_id)

@router.get("/students/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = services.StudentService.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(student_id: int, student: schemas.StudentUpdate, db: Session = Depends(get_db)):
    updated = services.StudentService.update_student(db, student_id, student)
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated

@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    deleted = services.StudentService.delete_student(db, student_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Student not found")

@router.post("/students/{student_id}/skills/", response_model=schemas.StudentSkillResponse)
def add_student_skill(student_id: int, skill_data: schemas.StudentSkillCreate, db: Session = Depends(get_db)):
    student = services.StudentService.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return services.StudentService.add_student_skill(db, student_id, skill_data)

@router.get("/students/{student_id}/skills/")
def get_student_skills(student_id: int, db: Session = Depends(get_db)):
    student = services.StudentService.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return services.StudentService.get_student_skills(db, student_id)

# ==================== Company Routes ====================
@router.post("/companies/", response_model=schemas.CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db)):
    return services.CompanyService.create_company(db, company)

@router.get("/companies/", response_model=List[schemas.CompanyResponse])
def get_companies(
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return services.CompanyService.get_companies(db, skip=skip, limit=limit, is_active=is_active)

@router.get("/companies/{company_id}", response_model=schemas.CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = services.CompanyService.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/companies/{company_id}", response_model=schemas.CompanyResponse)
def update_company(company_id: int, company: schemas.CompanyUpdate, db: Session = Depends(get_db)):
    updated = services.CompanyService.update_company(db, company_id, company)
    if not updated:
        raise HTTPException(status_code=404, detail="Company not found")
    return updated

@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    deleted = services.CompanyService.delete_company(db, company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company not found")

# ==================== Skill Routes ====================
@router.post("/skills/", response_model=schemas.SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    existing = services.SkillService.get_skill_by_name(db, skill.skill_name)
    if existing:
        raise HTTPException(status_code=400, detail="Skill with this name already exists")
    return services.SkillService.create_skill(db, skill)

@router.get("/skills/", response_model=List[schemas.SkillResponse])
def get_skills(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return services.SkillService.get_skills(db, skip=skip, limit=limit, category=category)

@router.get("/skills/{skill_id}", response_model=schemas.SkillResponse)
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = services.SkillService.get_skill(db, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.put("/skills/{skill_id}", response_model=schemas.SkillResponse)
def update_skill(skill_id: int, skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    updated = services.SkillService.update_skill(db, skill_id, skill)
    if not updated:
        raise HTTPException(status_code=404, detail="Skill not found")
    return updated

@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    deleted = services.SkillService.delete_skill(db, skill_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Skill not found")

# ==================== Internship Opportunity Routes ====================
@router.post("/opportunities/", response_model=schemas.InternshipOpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(opportunity: schemas.InternshipOpportunityCreate, db: Session = Depends(get_db)):
    company = services.CompanyService.get_company(db, opportunity.company_id)
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
    return services.InternshipOpportunityService.create_opportunity(db, opportunity)

@router.get("/opportunities/", response_model=List[schemas.InternshipOpportunityResponse])
def get_opportunities(
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return services.InternshipOpportunityService.get_opportunities(db, skip=skip, limit=limit, is_active=is_active)

@router.get("/opportunities/{opportunity_id}", response_model=schemas.InternshipOpportunityResponse)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = services.InternshipOpportunityService.get_opportunity(db, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity

@router.put("/opportunities/{opportunity_id}", response_model=schemas.InternshipOpportunityResponse)
def update_opportunity(opportunity_id: int, opportunity: schemas.InternshipOpportunityUpdate, db: Session = Depends(get_db)):
    updated = services.InternshipOpportunityService.update_opportunity(db, opportunity_id, opportunity)
    if not updated:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return updated

@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    deleted = services.InternshipOpportunityService.delete_opportunity(db, opportunity_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Opportunity not found")

# ==================== Application Routes ====================
@router.post("/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    try:
        return services.ApplicationService.create_application(db, application)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/applications/", response_model=List[schemas.ApplicationResponse])
def get_applications(
    skip: int = 0, 
    limit: int = 100, 
    student_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return services.ApplicationService.get_applications(db, skip=skip, limit=limit, student_id=student_id)

@router.get("/applications/{application_id}", response_model=schemas.ApplicationResponse)
def get_application(application_id: int, db: Session = Depends(get_db)):
    application = services.ApplicationService.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@router.put("/applications/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    application_id: int, 
    status_update: schemas.ApplicationStatusUpdate, 
    db: Session = Depends(get_db)
):
    try:
        updated = services.ApplicationService.update_application_status(db, application_id, status_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Application not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    deleted = services.ApplicationService.delete_application(db, application_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Application not found")

@router.get("/applications/{application_id}/history")
def get_application_history(application_id: int, db: Session = Depends(get_db)):
    history = services.ApplicationService.get_application_history(db, application_id)
    if not history:
        raise HTTPException(status_code=404, detail="No history found for this application")
    return history

# ==================== Eligibility Routes ====================
@router.post("/check-eligibility/", response_model=schemas.EligibilityCheckResponse)
def check_eligibility(request: schemas.EligibilityCheckRequest, db: Session = Depends(get_db)):
    return services.EligibilityService.check_eligibility(db, request.student_id, request.opportunity_id)

# ==================== Interview Routes ====================
@router.post("/interviews/", response_model=schemas.InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(interview: schemas.InterviewCreate, db: Session = Depends(get_db)):
    application = services.ApplicationService.get_application(db, interview.application_id)
    if not application:
        raise HTTPException(status_code=400, detail="Application not found")
    return services.InterviewService.create_interview(db, interview)

@router.get("/interviews/{interview_id}", response_model=schemas.InterviewResponse)
def get_interview(interview_id: int, db: Session = Depends(get_db)):
    interview = services.InterviewService.get_interview(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.get("/applications/{application_id}/interviews/", response_model=List[schemas.InterviewResponse])
def get_interviews_by_application(application_id: int, db: Session = Depends(get_db)):
    return services.InterviewService.get_interviews_by_application(db, application_id)

@router.put("/interviews/{interview_id}", response_model=schemas.InterviewResponse)
def update_interview(interview_id: int, interview: schemas.InterviewUpdate, db: Session = Depends(get_db)):
    updated = services.InterviewService.update_interview(db, interview_id, interview)
    if not updated:
        raise HTTPException(status_code=404, detail="Interview not found")
    return updated

@router.delete("/interviews/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(interview_id: int, db: Session = Depends(get_db)):
    deleted = services.InterviewService.delete_interview(db, interview_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Interview not found")