from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Dict, Any
import models
import schemas

class StudentService:
    @staticmethod
    def get_all(db: Session) -> List[models.Student]:
        return db.query(models.Student).all()
    
    @staticmethod
    def get_by_id(db: Session, student_id: int) -> models.Student:
        return db.query(models.Student).filter(models.Student.student_id == student_id).first()
    
    @staticmethod
    def create(db: Session, student: schemas.StudentCreate) -> models.Student:
        db_student = models.Student(**student.model_dump())
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        return db_student
    
    @staticmethod
    def update(db: Session, student_id: int, student: schemas.StudentCreate) -> models.Student:
        db_student = StudentService.get_by_id(db, student_id)
        if db_student:
            for key, value in student.model_dump().items():
                setattr(db_student, key, value)
            db.commit()
            db.refresh(db_student)
        return db_student
    
    @staticmethod
    def delete(db: Session, student_id: int) -> bool:
        db_student = StudentService.get_by_id(db, student_id)
        if db_student:
            db.delete(db_student)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_eligible_opportunities(db: Session, student_id: int) -> List[models.InternshipOpportunity]:
        student = StudentService.get_by_id(db, student_id)
        if not student:
            return []
        
        return db.query(models.InternshipOpportunity).join(
            models.EligibilityCriteria, 
            models.InternshipOpportunity.opportunity_id == models.EligibilityCriteria.opportunity_id
        ).filter(
            models.InternshipOpportunity.is_active == True,
            models.InternshipOpportunity.application_deadline >= date.today(),
            models.EligibilityCriteria.min_cgpa <= student.current_cgpa,
            (models.EligibilityCriteria.required_department == None) | 
            (models.EligibilityCriteria.required_department == student.department)
        ).all()
    
    @staticmethod
    def get_applications(db: Session, student_id: int) -> List[Dict[str, Any]]:
        student = StudentService.get_by_id(db, student_id)
        if not student:
            return []
        
        applications = db.query(models.Application).filter(
            models.Application.student_id == student_id
        ).all()
        
        result = []
        for app in applications:
            result.append({
                "application_id": app.application_id,
                "status": app.status,
                "application_date": app.application_date,
                "opportunity": {
                    "title": app.opportunity.title,
                    "company": app.opportunity.company.company_name,
                    "internship_type": app.opportunity.internship_type
                }
            })
        return result

class CompanyService:
    @staticmethod
    def get_all(db: Session) -> List[models.Company]:
        return db.query(models.Company).all()
    
    @staticmethod
    def get_by_id(db: Session, company_id: int) -> models.Company:
        return db.query(models.Company).filter(models.Company.company_id == company_id).first()
    
    @staticmethod
    def create(db: Session, company: schemas.CompanyCreate) -> models.Company:
        db_company = models.Company(**company.model_dump())
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        return db_company

class OpportunityService:
    @staticmethod
    def get_all(db: Session) -> List[models.InternshipOpportunity]:
        return db.query(models.InternshipOpportunity).all()
    
    @staticmethod
    def get_by_id(db: Session, opportunity_id: int) -> models.InternshipOpportunity:
        return db.query(models.InternshipOpportunity).filter(
            models.InternshipOpportunity.opportunity_id == opportunity_id
        ).first()
    
    @staticmethod
    def create(db: Session, opportunity: schemas.InternshipOpportunityCreate) -> models.InternshipOpportunity:
        db_opportunity = models.InternshipOpportunity(**opportunity.model_dump())
        db.add(db_opportunity)
        db.commit()
        db.refresh(db_opportunity)
        return db_opportunity
    
    @staticmethod
    def get_applications(db: Session, opportunity_id: int) -> List[Dict[str, Any]]:
        opportunity = OpportunityService.get_by_id(db, opportunity_id)
        if not opportunity:
            return []
        
        applications = db.query(models.Application).filter(
            models.Application.opportunity_id == opportunity_id
        ).all()
        
        result = []
        for app in applications:
            result.append({
                "application_id": app.application_id,
                "status": app.status,
                "student": {
                    "name": f"{app.student.first_name} {app.student.last_name}",
                    "department": app.student.department,
                    "cgpa": float(app.student.current_cgpa) if app.student.current_cgpa else None
                }
            })
        return result

class ApplicationService:
    @staticmethod
    def get_all(db: Session) -> List[models.Application]:
        return db.query(models.Application).all()
    
    @staticmethod
    def get_by_id(db: Session, application_id: int) -> models.Application:
        return db.query(models.Application).filter(
            models.Application.application_id == application_id
        ).first()
    
    @staticmethod
    def create(db: Session, application: schemas.ApplicationCreate) -> models.Application:
        # Check for duplicate
        existing = db.query(models.Application).filter(
            models.Application.student_id == application.student_id,
            models.Application.opportunity_id == application.opportunity_id
        ).first()
        if existing:
            return None
        
        db_application = models.Application(**application.model_dump())
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        return db_application
    
    @staticmethod
    def update_status(db: Session, application_id: int, new_status: str, change_reason: str = None) -> Dict[str, Any]:
        db_application = ApplicationService.get_by_id(db, application_id)
        if not db_application:
            return None
        
        old_status = db_application.status
        
        # Update application
        db_application.status = new_status
        db_application.last_status_update = date.today()
        
        # Create history record
        history = models.ApplicationStatusHistory(
            application_id=application_id,
            old_status=old_status,
            new_status=new_status,
            change_reason=change_reason,
            changed_by="API"
        )
        
        db.add(history)
        db.commit()
        
        return {"old_status": old_status, "new_status": new_status}

class SkillService:
    @staticmethod
    def get_all(db: Session) -> List[models.Skill]:
        return db.query(models.Skill).all()
    
    @staticmethod
    def create(db: Session, skill: schemas.SkillCreate) -> models.Skill:
        db_skill = models.Skill(**skill.model_dump())
        db.add(db_skill)
        db.commit()
        db.refresh(db_skill)
        return db_skill

class InterviewService:
    @staticmethod
    def get_all(db: Session) -> List[models.Interview]:
        return db.query(models.Interview).all()
    
    @staticmethod
    def create(db: Session, interview: schemas.InterviewCreate) -> models.Interview:
        # Check if application exists
        application = db.query(models.Application).filter(
            models.Application.application_id == interview.application_id
        ).first()
        if not application:
            return None
        
        db_interview = models.Interview(**interview.model_dump())
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        return db_interview

class EligibilityService:
    @staticmethod
    def get_all(db: Session) -> List[models.EligibilityCriteria]:
        return db.query(models.EligibilityCriteria).all()
    
    @staticmethod
    def create(db: Session, criteria: schemas.EligibilityCriteriaCreate) -> models.EligibilityCriteria:
        # Check if opportunity exists
        opportunity = db.query(models.InternshipOpportunity).filter(
            models.InternshipOpportunity.opportunity_id == criteria.opportunity_id
        ).first()
        if not opportunity:
            return None
        
        db_criteria = models.EligibilityCriteria(**criteria.model_dump())
        db.add(db_criteria)
        db.commit()
        db.refresh(db_criteria)
        return db_criteria

class StudentSkillService:
    @staticmethod
    def create(db: Session, student_skill: schemas.StudentSkillCreate) -> models.Student_Skill:
        # Check if relationship exists
        existing = db.query(models.Student_Skill).filter(
            models.Student_Skill.student_id == student_skill.student_id,
            models.Student_Skill.skill_id == student_skill.skill_id
        ).first()
        if existing:
            return None
        
        db_student_skill = models.Student_Skill(**student_skill.model_dump())
        db.add(db_student_skill)
        db.commit()
        return db_student_skill

class OpportunitySkillService:
    @staticmethod
    def create(db: Session, opp_skill: schemas.OpportunitySkillCreate) -> models.Opportunity_Skill:
        # Check if relationship exists
        existing = db.query(models.Opportunity_Skill).filter(
            models.Opportunity_Skill.opportunity_id == opp_skill.opportunity_id,
            models.Opportunity_Skill.skill_id == opp_skill.skill_id
        ).first()
        if existing:
            return None
        
        db_opp_skill = models.Opportunity_Skill(**opp_skill.model_dump())
        db.add(db_opp_skill)
        db.commit()
        return db_opp_skill

class DashboardService:
    @staticmethod
    def get_statistics(db: Session) -> Dict[str, Any]:
        total_students = db.query(models.Student).count()
        total_companies = db.query(models.Company).count()
        total_opportunities = db.query(models.InternshipOpportunity).count()
        
        active_opportunities = db.query(models.InternshipOpportunity).filter(
            models.InternshipOpportunity.is_active == True,
            models.InternshipOpportunity.application_deadline >= date.today()
        ).count()
        
        total_applications = db.query(models.Application).count()
        
        status_counts = db.query(
            models.Application.status, 
            func.count()
        ).group_by(models.Application.status).all()
        
        return {
            "total_students": total_students,
            "total_companies": total_companies,
            "total_opportunities": total_opportunities,
            "active_opportunities": active_opportunities,
            "total_applications": total_applications,
            "applications_by_status": dict(status_counts)
        }