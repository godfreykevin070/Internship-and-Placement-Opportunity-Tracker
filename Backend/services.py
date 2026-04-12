from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import date, datetime
from typing import List, Optional, Dict, Any
import logging
import models, schemas

logger = logging.getLogger(__name__)

# Department Services
class DepartmentService:
    @staticmethod
    def get_department(db: Session, department_id: int):
        return db.query(models.Department).filter(models.Department.department_id == department_id).first()
    
    @staticmethod
    def get_departments(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Department).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_department(db: Session, department: schemas.DepartmentCreate):
        db_department = models.Department(**department.model_dump())
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        return db_department
    
    @staticmethod
    def update_department(db: Session, department_id: int, department_update: schemas.DepartmentCreate):
        db_department = DepartmentService.get_department(db, department_id)
        if db_department:
            for key, value in department_update.model_dump().items():
                setattr(db_department, key, value)
            db.commit()
            db.refresh(db_department)
        return db_department
    
    @staticmethod
    def delete_department(db: Session, department_id: int):
        db_department = DepartmentService.get_department(db, department_id)
        if db_department:
            db.delete(db_department)
            db.commit()
            return True
        return False

# Student Services
class StudentService:
    @staticmethod
    def get_student(db: Session, student_id: int):
        return db.query(models.Student).filter(models.Student.student_id == student_id).first()
    
    @staticmethod
    def get_student_by_email(db: Session, email: str):
        return db.query(models.Student).filter(models.Student.email == email).first()
    
    @staticmethod
    def get_students(db: Session, skip: int = 0, limit: int = 100, department_id: Optional[int] = None):
        query = db.query(models.Student)
        if department_id:
            query = query.filter(models.Student.department_id == department_id)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_student(db: Session, student: schemas.StudentCreate):
        db_student = models.Student(**student.model_dump())
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        return db_student
    
    @staticmethod
    def update_student(db: Session, student_id: int, student_update: schemas.StudentUpdate):
        db_student = StudentService.get_student(db, student_id)
        if db_student:
            update_data = student_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_student, key, value)
            db.commit()
            db.refresh(db_student)
        return db_student
    
    @staticmethod
    def delete_student(db: Session, student_id: int):
        db_student = StudentService.get_student(db, student_id)
        if db_student:
            db.delete(db_student)
            db.commit()
            return True
        return False
    
    @staticmethod
    def add_student_skill(db: Session, student_id: int, skill_data: schemas.StudentSkillCreate):
        db_student_skill = models.StudentSkill(
            student_id=student_id,
            **skill_data.model_dump()
        )
        db.add(db_student_skill)
        db.commit()
        db.refresh(db_student_skill)
        return db_student_skill
    
    @staticmethod
    def get_student_skills(db: Session, student_id: int):
        return db.query(models.StudentSkill).filter(models.StudentSkill.student_id == student_id).all()

# Company Services
class CompanyService:
    @staticmethod
    def get_company(db: Session, company_id: int):
        return db.query(models.Company).filter(models.Company.company_id == company_id).first()
    
    @staticmethod
    def get_companies(db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None):
        query = db.query(models.Company)
        if is_active is not None:
            query = query.filter(models.Company.is_active == is_active)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_company(db: Session, company: schemas.CompanyCreate):
        db_company = models.Company(**company.model_dump())
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        return db_company
    
    @staticmethod
    def update_company(db: Session, company_id: int, company_update: schemas.CompanyUpdate):
        db_company = CompanyService.get_company(db, company_id)
        if db_company:
            update_data = company_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_company, key, value)
            db.commit()
            db.refresh(db_company)
        return db_company
    
    @staticmethod
    def delete_company(db: Session, company_id: int):
        db_company = CompanyService.get_company(db, company_id)
        if db_company:
            db.delete(db_company)
            db.commit()
            return True
        return False

# Skill Services
class SkillService:
    @staticmethod
    def get_skill(db: Session, skill_id: int):
        return db.query(models.Skill).filter(models.Skill.skill_id == skill_id).first()
    
    @staticmethod
    def get_skill_by_name(db: Session, skill_name: str):
        return db.query(models.Skill).filter(models.Skill.skill_name == skill_name).first()
    
    @staticmethod
    def get_skills(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None):
        query = db.query(models.Skill)
        if category:
            query = query.filter(models.Skill.category == category)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_skill(db: Session, skill: schemas.SkillCreate):
        db_skill = models.Skill(**skill.model_dump())
        db.add(db_skill)
        db.commit()
        db.refresh(db_skill)
        return db_skill
    
    @staticmethod
    def update_skill(db: Session, skill_id: int, skill_update: schemas.SkillCreate):
        db_skill = SkillService.get_skill(db, skill_id)
        if db_skill:
            for key, value in skill_update.model_dump().items():
                setattr(db_skill, key, value)
            db.commit()
            db.refresh(db_skill)
        return db_skill
    
    @staticmethod
    def delete_skill(db: Session, skill_id: int):
        db_skill = SkillService.get_skill(db, skill_id)
        if db_skill:
            db.delete(db_skill)
            db.commit()
            return True
        return False

# Internship Opportunity Services
class InternshipOpportunityService:
    @staticmethod
    def get_opportunity(db: Session, opportunity_id: int):
        return db.query(models.InternshipOpportunity).filter(
            models.InternshipOpportunity.opportunity_id == opportunity_id
        ).first()
    
    @staticmethod
    def get_opportunities(db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None):
        query = db.query(models.InternshipOpportunity)
        if is_active is not None:
            query = query.filter(models.InternshipOpportunity.is_active == is_active)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_opportunity(db: Session, opportunity: schemas.InternshipOpportunityCreate):
        db_opportunity = models.InternshipOpportunity(**opportunity.model_dump())
        db.add(db_opportunity)
        db.commit()
        db.refresh(db_opportunity)
        return db_opportunity
    
    @staticmethod
    def update_opportunity(db: Session, opportunity_id: int, opportunity_update: schemas.InternshipOpportunityUpdate):
        db_opportunity = InternshipOpportunityService.get_opportunity(db, opportunity_id)
        if db_opportunity:
            update_data = opportunity_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_opportunity, key, value)
            db.commit()
            db.refresh(db_opportunity)
        return db_opportunity
    
    @staticmethod
    def delete_opportunity(db: Session, opportunity_id: int):
        db_opportunity = InternshipOpportunityService.get_opportunity(db, opportunity_id)
        if db_opportunity:
            db.delete(db_opportunity)
            db.commit()
            return True
        return False

# Application Services
class ApplicationService:
    @staticmethod
    def get_application(db: Session, application_id: int):
        return db.query(models.Application).filter(models.Application.application_id == application_id).first()
    
    @staticmethod
    def get_applications(db: Session, skip: int = 0, limit: int = 100, student_id: Optional[int] = None):
        query = db.query(models.Application)
        if student_id:
            query = query.filter(models.Application.student_id == student_id)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_application(db: Session, application: schemas.ApplicationCreate):
        # Check if student is eligible
        eligibility = EligibilityService.check_eligibility(db, application.student_id, application.opportunity_id)
        if not eligibility["is_eligible"]:
            raise ValueError(f"Student is not eligible: {eligibility['message']}")
        
        # Check for duplicate application
        existing = db.query(models.Application).filter(
            models.Application.student_id == application.student_id,
            models.Application.opportunity_id == application.opportunity_id
        ).first()
        
        if existing:
            raise ValueError("Student has already applied for this opportunity")
        
        db_application = models.Application(**application.model_dump())
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        return db_application
    
    @staticmethod
    def update_application_status(db: Session, application_id: int, status_update: schemas.ApplicationStatusUpdate):
        db_application = ApplicationService.get_application(db, application_id)
        if not db_application:
            return None
        
        # Get new status ID
        new_status = db.query(models.ApplicationStatus).filter(
            models.ApplicationStatus.status_name == status_update.new_status_name
        ).first()
        
        if not new_status:
            raise ValueError(f"Invalid status name: {status_update.new_status_name}")
        
        old_status_id = db_application.status_id
        db_application.status_id = new_status.status_id
        db_application.last_status_update = datetime.now()
        
        # Add to history
        history = models.ApplicationStatusHistory(
            application_id=application_id,
            old_status_id=old_status_id,
            new_status_id=new_status.status_id,
            changed_by=status_update.changed_by,
            change_reason=status_update.change_reason
        )
        db.add(history)
        db.commit()
        db.refresh(db_application)
        return db_application
    
    @staticmethod
    def delete_application(db: Session, application_id: int):
        db_application = ApplicationService.get_application(db, application_id)
        if db_application:
            db.delete(db_application)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_application_history(db: Session, application_id: int):
        return db.query(models.ApplicationStatusHistory).filter(
            models.ApplicationStatusHistory.application_id == application_id
        ).order_by(models.ApplicationStatusHistory.changed_at.desc()).all()

# Eligibility Services
class EligibilityService:
    @staticmethod
    def check_eligibility(db: Session, student_id: int, opportunity_id: int) -> Dict[str, Any]:
        student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
        opportunity = db.query(models.InternshipOpportunity).filter(
            models.InternshipOpportunity.opportunity_id == opportunity_id
        ).first()
        
        if not student or not opportunity:
            return {
                "is_eligible": False,
                "student_name": student.first_name + " " + student.last_name if student else "Unknown",
                "opportunity_title": opportunity.title if opportunity else "Unknown",
                "student_cgpa": student.current_cgpa if student else 0,
                "min_cgpa_required": None,
                "department_match": False,
                "missing_skills": [],
                "message": "Student or opportunity not found"
            }
        
        criteria = db.query(models.EligibilityCriteria).filter(
            models.EligibilityCriteria.opportunity_id == opportunity_id
        ).first()
        
        if not criteria:
            return {
                "is_eligible": True,
                "student_name": f"{student.first_name} {student.last_name}",
                "opportunity_title": opportunity.title,
                "student_cgpa": student.current_cgpa,
                "min_cgpa_required": None,
                "department_match": True,
                "missing_skills": [],
                "message": "No specific criteria, eligible by default"
            }
        
        # Check CGPA
        cgpa_ok = True
        if criteria.min_cgpa and student.current_cgpa:
            cgpa_ok = student.current_cgpa >= criteria.min_cgpa
        
        # Check department
        dept_ok = True
        if criteria.required_department_id:
            dept_ok = student.department_id == criteria.required_department_id
        
        # Check skills
        required_skills = db.query(models.EligibilitySkill).filter(
            models.EligibilitySkill.criteria_id == criteria.criteria_id
        ).all()
        
        required_skill_ids = [rs.skill_id for rs in required_skills]
        student_skill_ids = [ss.skill_id for ss in student.skills] if student.skills else []
        
        missing_skills = []
        skill_names = []
        for skill_id in required_skill_ids:
            if skill_id not in student_skill_ids:
                skill = db.query(models.Skill).filter(models.Skill.skill_id == skill_id).first()
                if skill:
                    missing_skills.append(skill.skill_name)
                    skill_names.append(skill.skill_name)
        
        is_eligible = cgpa_ok and dept_ok and len(missing_skills) == 0
        
        message_parts = []
        if not cgpa_ok:
            message_parts.append(f"CGPA ({student.current_cgpa}) below required ({criteria.min_cgpa})")
        if not dept_ok:
            message_parts.append("Department mismatch")
        if missing_skills:
            message_parts.append(f"Missing skills: {', '.join(missing_skills)}")
        
        message = "Eligible" if is_eligible else f"Not eligible: {'; '.join(message_parts)}"
        
        return {
            "is_eligible": is_eligible,
            "student_name": f"{student.first_name} {student.last_name}",
            "opportunity_title": opportunity.title,
            "student_cgpa": student.current_cgpa,
            "min_cgpa_required": criteria.min_cgpa,
            "department_match": dept_ok,
            "missing_skills": skill_names,
            "message": message
        }

# Interview Services
class InterviewService:
    @staticmethod
    def get_interview(db: Session, interview_id: int):
        return db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()
    
    @staticmethod
    def get_interviews_by_application(db: Session, application_id: int):
        return db.query(models.Interview).filter(models.Interview.application_id == application_id).all()
    
    @staticmethod
    def create_interview(db: Session, interview: schemas.InterviewCreate):
        db_interview = models.Interview(**interview.model_dump())
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        return db_interview
    
    @staticmethod
    def update_interview(db: Session, interview_id: int, interview_update: schemas.InterviewUpdate):
        db_interview = InterviewService.get_interview(db, interview_id)
        if db_interview:
            update_data = interview_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_interview, key, value)
            db.commit()
            db.refresh(db_interview)
        return db_interview
    
    @staticmethod
    def delete_interview(db: Session, interview_id: int):
        db_interview = InterviewService.get_interview(db, interview_id)
        if db_interview:
            db.delete(db_interview)
            db.commit()
            return True
        return False