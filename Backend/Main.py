from fastapi import FastAPI
from contextlib import asynccontextmanager
from routes import (
    student_router, company_router, opportunity_router, 
    application_router, skill_router, interview_router,
    eligibility_router, student_skill_router, opportunity_skill_router,
    dashboard_router
)
from database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Clean up if needed

app = FastAPI(
    title="Internship and Placement Opportunity Tracker API",
    description="API for managing internships, students, applications, and placements",
    version="1.0.0",
    lifespan=lifespan
)

# Include all routers
app.include_router(student_router, prefix="/api/v1", tags=["Students"])
app.include_router(company_router, prefix="/api/v1", tags=["Companies"])
app.include_router(opportunity_router, prefix="/api/v1", tags=["Opportunities"])
app.include_router(application_router, prefix="/api/v1", tags=["Applications"])
app.include_router(skill_router, prefix="/api/v1", tags=["Skills"])
app.include_router(interview_router, prefix="/api/v1", tags=["Interviews"])
app.include_router(eligibility_router, prefix="/api/v1", tags=["Eligibility Criteria"])
app.include_router(student_skill_router, prefix="/api/v1", tags=["Student Skills"])
app.include_router(opportunity_skill_router, prefix="/api/v1", tags=["Opportunity Skills"])
app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])

@app.get("/")
def root():
    return {
        "message": "Internship and Placement Opportunity Tracker API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}