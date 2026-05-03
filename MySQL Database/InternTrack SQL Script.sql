-- ============================================================
--  PROJECT  : Internship and Placement Opportunity Tracker
-- ============================================================

-- ============================================================
-- SECTION 0 : DATABASE CREATION
-- ============================================================

DROP DATABASE IF EXISTS InternshipTracker;
CREATE DATABASE InternshipTracker;
USE InternshipTracker;


-- ============================================================
-- SECTION 1 : LOOKUP TABLES (For Normalization & Extensibility)
-- ============================================================

-- Lookup: Internship Type
CREATE TABLE InternshipType (
    type_id     INT PRIMARY KEY AUTO_INCREMENT,
    type_name   VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Lookup: Application Status
CREATE TABLE ApplicationStatus (
    status_id   INT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    is_final    BOOLEAN DEFAULT FALSE,
    description VARCHAR(255)
);

-- Lookup: Selection Round
CREATE TABLE SelectionRound (
    round_id    INT PRIMARY KEY AUTO_INCREMENT,
    round_name  VARCHAR(50) UNIQUE NOT NULL,
    round_order INT NOT NULL,
    description VARCHAR(255)
);

-- Lookup: Interview Type
CREATE TABLE InterviewType (
    type_id     INT PRIMARY KEY AUTO_INCREMENT,
    type_name   VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Lookup: Interview Status
CREATE TABLE InterviewStatus (
    status_id   INT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Lookup: Proficiency Level
CREATE TABLE ProficiencyLevel (
    level_id   INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(50) UNIQUE NOT NULL,
    sort_order INT
);

-- Lookup: Importance Level
CREATE TABLE ImportanceLevel (
    level_id   INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(50) UNIQUE NOT NULL,
    sort_order INT
);

-- Insert lookup data
INSERT INTO InternshipType (type_name, description) VALUES
('Summer', 'Summer internship (typically May-August)'),
('Winter', 'Winter internship (typically December-January)'),
('Semester', 'Full semester internship'),
('Year-Round', 'Part-time internship throughout the year');

INSERT INTO ApplicationStatus (status_name, is_final, description) VALUES
('Submitted', FALSE, 'Application submitted by student'),
('Under Review', FALSE, 'Application being reviewed by company'),
('Shortlisted', FALSE, 'Student shortlisted for next round'),
('Rejected', TRUE, 'Application rejected'),
('Selected', FALSE, 'Student selected for position'),
('Offer Accepted', TRUE, 'Student accepted the offer'),
('Offer Declined', TRUE, 'Student declined the offer');

INSERT INTO SelectionRound (round_name, round_order, description) VALUES
('Application', 1, 'Initial application screening'),
('Online Test', 2, 'Online assessment round'),
('Technical Interview', 3, 'Technical interview round'),
('HR Interview', 4, 'HR interview round'),
('Final', 5, 'Final decision round');

INSERT INTO InterviewType (type_name, description) VALUES
('Online', 'Interview conducted via video call'),
('In-Person', 'Face-to-face interview at company premises'),
('Phone', 'Phone screening interview');

INSERT INTO InterviewStatus (status_name, description) VALUES
('Scheduled', 'Interview has been scheduled'),
('Completed', 'Interview has been completed'),
('Cancelled', 'Interview was cancelled'),
('Rescheduled', 'Interview was rescheduled');

INSERT INTO ProficiencyLevel (level_name, sort_order) VALUES
('Beginner', 1),
('Intermediate', 2),
('Advanced', 3),
('Expert', 4);

INSERT INTO ImportanceLevel (level_name, sort_order) VALUES
('Required', 1),
('Preferred', 2),
('Optional', 3);


-- ============================================================
-- SECTION 2 : TABLE CREATION (DDL) - FULLY NORMALIZED
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 STRONG ENTITIES
-- ------------------------------------------------------------

-- Department table
CREATE TABLE Department (
    department_id   INT          PRIMARY KEY AUTO_INCREMENT,
    department_code VARCHAR(10)  UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    hod_name        VARCHAR(100),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Student table
CREATE TABLE Student (
    student_id        INT            PRIMARY KEY AUTO_INCREMENT,
    enrollment_number VARCHAR(20)    UNIQUE NOT NULL,
    first_name        VARCHAR(50)    NOT NULL,
    last_name         VARCHAR(50)    NOT NULL,
    email             VARCHAR(100)   UNIQUE NOT NULL,
    phone             VARCHAR(15),
    date_of_birth     DATE,
    current_cgpa      DECIMAL(3,2)   CHECK (current_cgpa BETWEEN 0.0 AND 10.0),
    department_id     INT,                                         
    academic_year     INT,
    resume_link       VARCHAR(255),
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Department(department_id) ON DELETE SET NULL,
    INDEX idx_department (department_id),
    INDEX idx_cgpa       (current_cgpa)
);

-- Company table
CREATE TABLE Company (
    company_id       INT           PRIMARY KEY AUTO_INCREMENT,
    company_name     VARCHAR(100)  UNIQUE NOT NULL,
    industry         VARCHAR(50),
    website          VARCHAR(255),
    hr_contact_name  VARCHAR(100),
    hr_contact_email VARCHAR(100),
    hr_contact_phone VARCHAR(15),
    company_size     VARCHAR(20),
    founded_year     INT,
    is_active        BOOLEAN       DEFAULT TRUE,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- InternshipOpportunity table
CREATE TABLE InternshipOpportunity (
    opportunity_id       INT         PRIMARY KEY AUTO_INCREMENT,
    company_id           INT         NOT NULL,
    title                VARCHAR(100) NOT NULL,
    description          TEXT,
    internship_type_id   INT         NOT NULL,                    
    duration_weeks       INT,
    stipend_amount       DECIMAL(10,2),
    location             VARCHAR(100),
    remote_option        BOOLEAN     DEFAULT FALSE,
    application_deadline DATE,
    start_date           DATE,
    max_applications     INT,
    is_active            BOOLEAN     DEFAULT TRUE,
    created_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id)         REFERENCES Company(company_id) ON DELETE CASCADE,
    FOREIGN KEY (internship_type_id) REFERENCES InternshipType(type_id),
    INDEX idx_deadline   (application_deadline),
    INDEX idx_type       (internship_type_id)
);

-- Skill table — unchanged
CREATE TABLE Skill (
    skill_id   INT          PRIMARY KEY AUTO_INCREMENT,
    skill_name VARCHAR(50)  UNIQUE NOT NULL,
    category   VARCHAR(50)
);

-- ------------------------------------------------------------
-- 2.2 WEAK ENTITIES (FULLY NORMALIZED)
-- ------------------------------------------------------------

-- EligibilityCriteria
CREATE TABLE EligibilityCriteria (
    criteria_id             INT          PRIMARY KEY AUTO_INCREMENT,
    opportunity_id          INT          NOT NULL,
    min_cgpa                DECIMAL(3,2) CHECK (min_cgpa BETWEEN 0.0 AND 10.0),
    required_department_id  INT,                                   
    academic_year_required  INT,
    backlogs_allowed        INT          DEFAULT 0,
    FOREIGN KEY (opportunity_id) REFERENCES InternshipOpportunity(opportunity_id) ON DELETE CASCADE,
    FOREIGN KEY (required_department_id) REFERENCES Department(department_id) ON DELETE SET NULL,
    INDEX idx_min_cgpa (min_cgpa)
);

-- Eligibility_Skill
CREATE TABLE Eligibility_Skill (
    criteria_id  INT NOT NULL,
    skill_id     INT NOT NULL,
    PRIMARY KEY (criteria_id, skill_id),
    FOREIGN KEY (criteria_id) REFERENCES EligibilityCriteria(criteria_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)    REFERENCES Skill(skill_id) ON DELETE CASCADE
);

-- Application table 
CREATE TABLE Application (
    application_id       INT        PRIMARY KEY AUTO_INCREMENT,
    student_id           INT        NOT NULL,
    opportunity_id       INT        NOT NULL,
    application_date     TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    cover_letter         TEXT,
    status_id            INT        NOT NULL DEFAULT 1,            
    applied_via          VARCHAR(50),
    last_status_update   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    selection_round_id   INT        NOT NULL DEFAULT 1,            
    remarks              TEXT,
    UNIQUE KEY unique_application (student_id, opportunity_id),
    FOREIGN KEY (student_id)      REFERENCES Student(student_id)               ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id)  REFERENCES InternshipOpportunity(opportunity_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id)       REFERENCES ApplicationStatus(status_id),
    FOREIGN KEY (selection_round_id) REFERENCES SelectionRound(round_id),
    INDEX idx_status           (status_id),
    INDEX idx_application_date (application_date)
);

-- ApplicationStatusHistory 
CREATE TABLE ApplicationStatusHistory (
    history_id     INT          PRIMARY KEY AUTO_INCREMENT,
    application_id INT          NOT NULL,
    old_status_id  INT,                                               
    new_status_id  INT          NOT NULL,                             
    changed_by     VARCHAR(50)  DEFAULT 'System',
    change_reason  TEXT,
    changed_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES Application(application_id) ON DELETE CASCADE,
    FOREIGN KEY (old_status_id) REFERENCES ApplicationStatus(status_id),
    FOREIGN KEY (new_status_id) REFERENCES ApplicationStatus(status_id),
    INDEX idx_change_date (changed_at)
);

-- Interview table 
CREATE TABLE Interview (
    interview_id       INT          PRIMARY KEY AUTO_INCREMENT,
    application_id     INT          NOT NULL,
    interview_date     DATETIME     NOT NULL,
    interview_type_id  INT          NOT NULL,                      
    interviewer_name   VARCHAR(100),
    interview_platform VARCHAR(50),
    duration_minutes   INT,
    feedback           TEXT,
    score              DECIMAL(5,2),
    status_id          INT          NOT NULL DEFAULT 1,            
    FOREIGN KEY (application_id) REFERENCES Application(application_id) ON DELETE CASCADE,
    FOREIGN KEY (interview_type_id) REFERENCES InterviewType(type_id),
    FOREIGN KEY (status_id) REFERENCES InterviewStatus(status_id),
    INDEX idx_interview_date (interview_date)
);

-- Student_Skill 
CREATE TABLE Student_Skill (
    student_id            INT          NOT NULL,
    skill_id              INT          NOT NULL,
    proficiency_level_id  INT          NOT NULL DEFAULT 2,         
    years_of_experience   DECIMAL(3,1),
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)   REFERENCES Skill(skill_id)   ON DELETE CASCADE,
    FOREIGN KEY (proficiency_level_id) REFERENCES ProficiencyLevel(level_id)
);

-- Opportunity_Skill 
CREATE TABLE Opportunity_Skill (
    opportunity_id      INT NOT NULL,
    skill_id            INT NOT NULL,
    importance_level_id INT NOT NULL DEFAULT 2,                   
    PRIMARY KEY (opportunity_id, skill_id),
    FOREIGN KEY (opportunity_id) REFERENCES InternshipOpportunity(opportunity_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)       REFERENCES Skill(skill_id)                       ON DELETE CASCADE,
    FOREIGN KEY (importance_level_id) REFERENCES ImportanceLevel(level_id)
);

-- ------------------------------------------------------------
-- 2.3 ADDITIONAL INDEXES FOR QUERY PERFORMANCE
-- ------------------------------------------------------------
CREATE INDEX idx_student_name          ON Student(first_name, last_name);
CREATE INDEX idx_company_name          ON Company(company_name);
CREATE INDEX idx_opportunity_active    ON InternshipOpportunity(is_active, application_deadline);
CREATE INDEX idx_application_status_date ON Application(status_id, application_date);
CREATE INDEX idx_interview_status      ON Interview(status_id, interview_date);


-- ============================================================
-- SECTION 3 : SAMPLE DATA INSERTION (DML — INSERT)
-- ============================================================

-- Insert departments
INSERT INTO Department (department_code, department_name, hod_name) VALUES
('CSE', 'Computer Science & Engineering', 'Dr. Alan Turing'),
('ECE', 'Electronics & Communication', 'Dr. Ada Lovelace'),
('ME', 'Mechanical Engineering', 'Dr. Nikola Tesla'),
('CE', 'Civil Engineering', 'Dr. Isambard Brunel'),
('IT', 'Information Technology', 'Dr. Grace Hopper'),
('EE', 'Electrical Engineering', 'Dr. Michael Faraday');

-- Insert skills master list
INSERT INTO Skill (skill_name, category) VALUES
-- Programming Languages
('Python', 'Programming'),
('Java', 'Programming'),
('JavaScript', 'Programming'),
('C++', 'Programming'),
('Go', 'Programming'),

-- Web Development
('React', 'Web Development'),
('Angular', 'Web Development'),
('Node.js', 'Web Development'),
('Django', 'Web Development'),

-- Databases
('SQL', 'Database'),
('MongoDB', 'Database'),
('PostgreSQL', 'Database'),

-- Cloud & DevOps
('AWS', 'Cloud'),
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),

-- AI/ML
('Machine Learning', 'AI/ML'),
('Deep Learning', 'AI/ML'),
('NLP', 'AI/ML'),

-- Soft Skills
('Communication', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Teamwork', 'Soft Skills'),
('Leadership', 'Soft Skills');

-- Insert companies
INSERT INTO Company (company_name, industry, website, hr_contact_name, hr_contact_email, hr_contact_phone, company_size, founded_year, is_active) VALUES
('Google India', 'Technology', 'https://careers.google.com', 'Priya Sharma', 'hr@google.co.in', '9876500001', '10000+', 1998, TRUE),
('Microsoft India', 'Technology', 'https://careers.microsoft.com', 'Rahul Verma', 'hr@microsoft.co.in', '9876500002', '10000+', 1990, TRUE),
('Amazon India', 'E-commerce', 'https://amazon.jobs', 'Neha Gupta', 'hr@amazon.co.in', '9876500003', '10000+', 1994, TRUE),
('Flipkart', 'E-commerce', 'https://flipkart.careers', 'Vikram Singh', 'hr@flipkart.com', '9876500004', '10000+', 2007, TRUE),
('TCS', 'IT Services', 'https://tcs.com/careers', 'Rajesh Kumar', 'hr@tcs.com', '9876500005', '50000+', 1968, TRUE),
('Infosys', 'IT Services', 'https://infosys.com/careers', 'Meera Joshi', 'hr@infosys.com', '9876500006', '50000+', 1981, TRUE),
('Zomato', 'Food Tech', 'https://zomato.com/careers', 'Deepinder Goyal', 'careers@zomato.com', '9876500007', '5000+', 2008, TRUE),
('Swiggy', 'Food Tech', 'https://swiggy.com/careers', 'Sriharsha Majety', 'hr@swiggy.com', '9876500008', '5000+', 2014, TRUE),
('Paytm', 'Fintech', 'https://paytm.com/careers', 'Vijay Shekhar', 'hr@paytm.com', '9876500009', '10000+', 2010, TRUE),
('Razorpay', 'Fintech', 'https://razorpay.com/careers', 'Harshil Mathur', 'careers@razorpay.com', '9876500010', '1000+', 2014, TRUE);

-- Insert students (8 students from different departments)
INSERT INTO Student (enrollment_number, first_name, last_name, email, phone, date_of_birth, current_cgpa, department_id, academic_year, resume_link) VALUES

-- CSE Students
('CSE2021001', 'Arjun', 'Reddy', 'arjun.reddy@university.edu', '9988776601', '2002-05-15', 8.7, 1, 3, 'https://drive.google.com/arjun_resume'),
('CSE2021002', 'Divya', 'Sharma', 'divya.sharma@university.edu', '9988776602', '2002-08-22', 9.2, 1, 3, 'https://drive.google.com/divya_resume'),
('CSE2021003', 'Rahul', 'Patel', 'rahul.patel@university.edu', '9988776603', '2002-03-10', 8.4, 1, 3, 'https://drive.google.com/rahul_resume'),

-- IT Students
('IT2021001', 'Sneha', 'Verma', 'sneha.verma@university.edu', '9988776604', '2002-11-05', 9.0, 5, 3, 'https://drive.google.com/sneha_resume'),
('IT2021002', 'Kunal', 'Joshi', 'kunal.joshi@university.edu', '9988776605', '2002-07-19', 8.2, 5, 3, 'https://drive.google.com/kunal_resume'),

-- ECE Students
('ECE2021001', 'Neha', 'Gupta', 'neha.gupta@university.edu', '9988776606', '2002-01-30', 8.9, 2, 3, 'https://drive.google.com/neha_resume'),
('ECE2021002', 'Vikram', 'Singh', 'vikram.singh@university.edu', '9988776607', '2002-09-12', 7.8, 2, 3, 'https://drive.google.com/vikram_resume'),

-- ME Student
('ME2021001', 'Raj', 'Kumar', 'raj.kumar@university.edu', '9988776608', '2002-04-25', 8.0, 3, 3, 'https://drive.google.com/raj_resume');

-- Insert student skills (showing proficiency levels)
INSERT INTO Student_Skill (student_id, skill_id, proficiency_level_id, years_of_experience) VALUES

-- Arjun (CSE) - Strong in Python, Web Dev, Cloud
(1, 1, 3, 2.5),   -- Python - Advanced
(1, 5, 2, 1.0),   -- Go - Intermediate
(1, 6, 3, 2.0),   -- React - Advanced
(1, 8, 2, 1.5),   -- Node.js - Intermediate
(1, 11, 3, 2.0),  -- SQL - Advanced
(1, 14, 2, 1.0),  -- AWS - Intermediate
(1, 19, 3, 3.0),  -- Problem Solving - Advanced

-- Divya (CSE) - Excellent in AI/ML, Python
(2, 1, 4, 3.5),   -- Python - Expert
(2, 16, 3, 2.0),  -- Machine Learning - Advanced
(2, 17, 3, 1.5),  -- Deep Learning - Advanced
(2, 11, 4, 3.0),  -- SQL - Expert
(2, 19, 4, 4.0),  -- Problem Solving - Expert
(2, 20, 3, 3.0),  -- Communication - Advanced

-- Rahul (CSE) - Full Stack Developer
(3, 2, 3, 2.0),   -- Java - Advanced
(3, 3, 3, 2.5),   -- JavaScript - Advanced
(3, 6, 3, 2.0),   -- React - Advanced
(3, 8, 3, 2.0),   -- Node.js - Advanced
(3, 11, 3, 2.0),  -- SQL - Advanced
(3, 12, 2, 1.0),  -- MongoDB - Intermediate

-- Sneha (IT) - Cloud & DevOps focus
(4, 1, 3, 2.0),   -- Python - Advanced
(4, 14, 3, 2.0),  -- AWS - Advanced
(4, 15, 2, 1.5),  -- Docker - Intermediate
(4, 16, 2, 1.0),  -- Kubernetes - Intermediate
(4, 11, 3, 2.0),  -- SQL - Advanced
(4, 20, 3, 3.0),  -- Communication - Advanced

-- Kunal (IT) - Full Stack with Java
(5, 2, 3, 2.5),   -- Java - Advanced
(5, 3, 2, 2.0),   -- JavaScript - Intermediate
(5, 7, 2, 1.5),   -- Angular - Intermediate
(5, 9, 2, 1.5),   -- Django - Intermediate
(5, 12, 2, 1.0),  -- MongoDB - Intermediate
(5, 19, 3, 3.0),  -- Problem Solving - Advanced

-- Neha (ECE) - Embedded & Python
(6, 1, 2, 1.5),   -- Python - Intermediate
(6, 4, 3, 2.0),   -- C++ - Advanced
(6, 19, 3, 3.0),  -- Problem Solving - Advanced
(6, 20, 2, 2.0),  -- Communication - Intermediate

-- Vikram (ECE) - Hardware & Programming
(7, 4, 3, 2.0),   -- C++ - Advanced
(7, 2, 2, 1.5),   -- Java - Intermediate
(7, 19, 2, 2.0),  -- Problem Solving - Intermediate

-- Raj (ME) - Technical & Soft Skills
(8, 19, 3, 3.0),  -- Problem Solving - Advanced
(8, 18, 2, 2.0),  -- Teamwork - Intermediate
(8, 20, 2, 2.0);  -- Communication - Intermediate

-- Insert internship opportunities
INSERT INTO InternshipOpportunity (company_id, title, description, internship_type_id, duration_weeks, stipend_amount, location, remote_option, application_deadline, start_date, max_applications, is_active) VALUES

-- Google Opportunities
(1, 'Software Engineering Intern', 'Work on Google\'s core products and services. Focus on scalable distributed systems.', 1, 12, 150000.00, 'Bangalore', 0, '2025-03-15', '2025-05-15', 50, 1),
(1, 'SDE Intern (Frontend) - Google Pay', 'Build responsive, user-friendly interfaces for India\'s leading payment app.', 1, 12, 150000.00, 'Bangalore', 0, '2025-03-20', '2025-05-20', 30, 1),

-- Microsoft Opportunities
(2, 'Software Development Intern', 'Join Microsoft India Development Center. Work on Azure, Office 365 or Windows.', 1, 12, 140000.00, 'Hyderabad', 0, '2025-03-10', '2025-05-10', 60, 1),
(2, 'Data Science Intern', 'Work with big data to derive insights for Microsoft products.', 1, 12, 140000.00, 'Hyderabad', 0, '2025-03-12', '2025-05-12', 25, 1),

-- Amazon Opportunities
(3, 'SDE Intern', 'Build scalable systems for Amazon India\'s e-commerce platform.', 1, 12, 130000.00, 'Bangalore', 0, '2025-03-18', '2025-05-18', 100, 1),
(3, 'Frontend Engineer Intern', 'Create responsive web applications for Amazon\'s customer-facing features.', 1, 12, 130000.00, 'Chennai', 1, '2025-03-22', '2025-05-22', 40, 1),

-- Flipkart Opportunities
(4, 'Software Development Intern', 'Work on scaling Flipkart\'s e-commerce platform.', 1, 10, 120000.00, 'Bangalore', 0, '2025-03-25', '2025-06-01', 45, 1),
(4, 'DevOps Engineer Intern', 'Build and maintain CI/CD pipelines for Flipkart\'s microservices.', 1, 10, 120000.00, 'Bangalore', 0, '2025-03-25', '2025-06-01', 20, 1),

-- TCS Opportunities
(5, 'Systems Engineer Intern', 'Join TCS\'s premier training program for fresh graduates.', 1, 12, 50000.00, 'Mumbai', 0, '2025-04-30', '2025-07-01', 200, 1),
(5, 'Full Stack Developer Intern', 'Work on enterprise web applications for global clients.', 3, 20, 55000.00, 'Pune', 1, '2025-05-15', '2025-08-01', 80, 1),

-- Infosys Opportunities
(6, 'Power Programmer Intern', 'Elite program for top coding talent at Infosys.', 1, 12, 100000.00, 'Mysore', 0, '2025-03-28', '2025-06-15', 30, 1),
(6, 'AI/ML Intern', 'Work on cutting-edge AI solutions for Infosys clients.', 1, 12, 110000.00, 'Pune', 1, '2025-04-05', '2025-06-20', 25, 1),

-- Zomato Opportunities
(7, 'Backend Engineer Intern', 'Build scalable APIs for Zomato\'s food delivery platform.', 1, 8, 80000.00, 'Gurgaon', 0, '2025-04-10', '2025-06-01', 35, 1),
(7, 'Data Analyst Intern', 'Analyze user behavior and restaurant data to drive business decisions.', 1, 8, 70000.00, 'Gurgaon', 1, '2025-04-12', '2025-06-01', 20, 1),

-- Swiggy Opportunities
(8, 'SDE Intern - Platform Engineering', 'Work on Swiggy\'s core platform services.', 1, 8, 80000.00, 'Bangalore', 0, '2025-04-15', '2025-06-05', 30, 1),
(8, 'Mobile Dev Intern (React Native)', 'Build cross-platform mobile features for Swiggy app.', 1, 8, 75000.00, 'Bangalore', 0, '2025-04-18', '2025-06-05', 20, 1),

-- Paytm Opportunities
(9, 'Software Engineer Intern - Payments', 'Work on India\'s leading payment gateway.', 1, 10, 90000.00, 'Noida', 0, '2025-04-20', '2025-06-10', 50, 1),
(9, 'Security Engineer Intern', 'Work on payment security and fraud detection.', 1, 10, 95000.00, 'Noida', 0, '2025-04-22', '2025-06-10', 15, 1),

-- Razorpay Opportunities
(10, 'SDE Intern', 'Build banking infrastructure for India\'s businesses.', 1, 12, 100000.00, 'Bangalore', 0, '2025-04-08', '2025-06-01', 40, 1),
(10, 'Frontend Intern', 'Create beautiful payment experiences for merchants.', 1, 12, 100000.00, 'Bangalore', 1, '2025-04-10', '2025-06-01', 25, 1);

-- Insert eligibility criteria for each opportunity
INSERT INTO EligibilityCriteria (opportunity_id, min_cgpa, required_department_id, academic_year_required, backlogs_allowed) VALUES

-- Google (CSE/IT focus)
(1, 8.5, 1, 3, 0),   -- Software Engineering Intern - CSE only
(1, 8.5, 5, 3, 0),   -- Software Engineering Intern - IT only
(2, 8.0, 1, 3, 0),   -- Frontend Intern - CSE only
(2, 8.0, 5, 3, 0),   -- Frontend Intern - IT only

-- Microsoft (CSE/IT focus)
(3, 8.0, 1, 3, 0),   -- SDE Intern - CSE only
(3, 8.0, 5, 3, 0),   -- SDE Intern - IT only
(4, 8.5, 1, 3, 0),   -- Data Science Intern - CSE only
(4, 8.5, 5, 3, 0),   -- Data Science Intern - IT only

-- Amazon (CSE/IT/ECE)
(5, 8.0, 1, 3, 1),   -- SDE Intern - CSE
(5, 8.0, 5, 3, 1),   -- SDE Intern - IT
(5, 8.5, 2, 3, 0),   -- SDE Intern - ECE
(6, 7.5, 1, 3, 1),   -- Frontend Intern - CSE
(6, 7.5, 5, 3, 1),   -- Frontend Intern - IT

-- Flipkart (CSE/IT)
(7, 7.8, 1, 3, 1),   -- SDE Intern - CSE
(7, 7.8, 5, 3, 1),   -- SDE Intern - IT
(8, 7.5, 1, 3, 1),   -- DevOps Intern - CSE
(8, 7.5, 5, 3, 1),   -- DevOps Intern - IT

-- TCS (All departments)
(9, 7.0, NULL, 3, 2),  -- Systems Engineer - Any department
(10, 7.0, NULL, 3, 2), -- Full Stack - Any department

-- Infosys (CSE/IT)
(11, 8.5, 1, 3, 0),   -- Power Programmer - CSE
(11, 8.5, 5, 3, 0),   -- Power Programmer - IT
(12, 8.0, 1, 3, 0),   -- AI/ML Intern - CSE
(12, 8.0, 5, 3, 0),   -- AI/ML Intern - IT

-- Zomato (CSE/IT)
(13, 7.5, 1, 3, 1),   -- Backend Engineer - CSE
(13, 7.5, 5, 3, 1),   -- Backend Engineer - IT
(14, 7.0, NULL, 3, 2), -- Data Analyst - Any department

-- Swiggy (CSE/IT)
(15, 7.5, 1, 3, 1),   -- Platform Engineering - CSE
(15, 7.5, 5, 3, 1),   -- Platform Engineering - IT
(16, 7.5, 1, 3, 1),   -- Mobile Dev - CSE
(16, 7.5, 5, 3, 1),   -- Mobile Dev - IT

-- Paytm (CSE/IT/ECE)
(17, 7.5, 1, 3, 1),   -- Payments Engineer - CSE
(17, 7.5, 5, 3, 1),   -- Payments Engineer - IT
(17, 8.0, 2, 3, 0),   -- Payments Engineer - ECE
(18, 8.0, 1, 3, 0),   -- Security Engineer - CSE
(18, 8.0, 5, 3, 0),   -- Security Engineer - IT

-- Razorpay (CSE/IT)
(19, 7.8, 1, 3, 1),   -- SDE Intern - CSE
(19, 7.8, 5, 3, 1),   -- SDE Intern - IT
(20, 7.5, 1, 3, 1),   -- Frontend Intern - CSE
(20, 7.5, 5, 3, 1);   -- Frontend Intern - IT

-- Insert eligibility skills (skills required for each opportunity)
INSERT INTO Eligibility_Skill (criteria_id, skill_id) VALUES

-- Google SDE (criteria_id 1 & 2) - Python, DSA, Problem Solving
(1, 1), (2, 1),  -- Python
(1, 19), (2, 19), -- Problem Solving

-- Google Frontend (criteria_id 3 & 4) - React, JavaScript
(3, 3), (4, 3),  -- JavaScript
(3, 6), (4, 6),  -- React

-- Microsoft SDE (criteria_id 5 & 6)
(5, 1), (6, 1),  -- Python
(5, 2), (6, 2),  -- Java
(5, 19), (6, 19), -- Problem Solving

-- Microsoft Data Science (criteria_id 7 & 8)
(7, 1), (8, 1),  -- Python
(7, 16), (8, 16), -- Machine Learning
(7, 11), (8, 11), -- SQL

-- Amazon SDE (criteria_id 9,10,11)
(9, 1), (10, 1), (11, 1),  -- Python
(9, 19), (10, 19), (11, 19), -- Problem Solving

-- Amazon Frontend (criteria_id 12,13)
(12, 3), (13, 3),  -- JavaScript
(12, 6), (13, 6),  -- React

-- Flipkart (14,15,16,17)
(14, 1), (15, 1), (16, 1), (17, 1),  -- Python/Java
(14, 2), (15, 2), (16, 2), (17, 2),
(14, 19), (15, 19), (16, 19), (17, 19),

-- TCS (18,19) - Basic programming
(18, 1), (19, 1),  -- Python
(18, 2), (19, 2),  -- Java

-- Infosys Power Programmer (20,21)
(20, 1), (21, 1),  -- Python
(20, 19), (21, 19), -- Problem Solving

-- Infosys AI/ML (22,23)
(22, 1), (23, 1),  -- Python
(22, 16), (23, 16), -- Machine Learning

-- Zomato (24,25,26)
(24, 1), (25, 1),  -- Python
(24, 8), (25, 8),  -- Node.js
(26, 11),  -- SQL for data analyst

-- Swiggy (27,28,29,30)
(27, 1), (28, 1), (29, 1), (30, 1),  -- Python
(27, 19), (28, 19), (29, 19), (30, 19), -- Problem Solving

-- Paytm (31,32,33,34,35)
(31, 1), (32, 1), (33, 1), (34, 1), (35, 1),  -- Python/Java
(31, 2), (32, 2), (33, 2),
(31, 19), (32, 19), (33, 19), (34, 19), (35, 19),

-- Razorpay (36,37,38,39)
(36, 1), (37, 1), (38, 1), (39, 1),  -- Python/Java
(36, 2), (37, 2),
(36, 19), (37, 19), (38, 19), (39, 19);

-- Insert opportunity skills (skills preferred/required for opportunities)
INSERT INTO Opportunity_Skill (opportunity_id, skill_id, importance_level_id) VALUES

-- Google SDE
(1, 1, 1),   -- Python - Required
(1, 2, 2),   -- Java - Preferred
(1, 14, 2),  -- AWS - Preferred

-- Microsoft SDE
(3, 1, 1),   -- Python - Required
(3, 2, 2),   -- Java - Preferred

-- Amazon SDE
(5, 1, 1),   -- Python - Required
(5, 14, 2),  -- AWS - Preferred

-- TCS Systems
(9, 1, 2),   -- Python - Preferred
(9, 2, 2);   -- Java - Preferred

-- Insert applications (showing various stages)
INSERT INTO Application (student_id, opportunity_id, status_id, selection_round_id, cover_letter, applied_via) VALUES

-- Arjun (CSE) - Google SDE application
(1, 1, 3, 3, 'I am passionate about distributed systems and have completed multiple projects in Python. My DSA skills are strong and I am eager to contribute to Google\'s mission.', 'LinkedIn'),

-- Arjun - Amazon SDE
(1, 5, 2, 2, 'I have experience building scalable applications and am confident in my ability to contribute to Amazon\'s e-commerce platform.', 'Company Website'),

-- Arjun - Flipkart SDE
(1, 7, 1, 1, 'As a CSE student with strong Python skills, I would love to work on Flipkart\'s massive scale problems.', 'Campus Placement'),

-- Divya (CSE) - Microsoft Data Science
(2, 4, 4, 2, 'My expertise in Machine Learning and Deep Learning makes me an ideal candidate for this role. I have completed multiple Kaggle competitions.', 'LinkedIn'),
-- Status: Rejected after online test

-- Divya - Infosys AI/ML
(2, 12, 5, 4, 'I am passionate about AI and have published papers in machine learning. I would bring strong analytical skills to Infosys.', 'Company Website'),
-- Status: Selected, at HR Interview stage

-- Divya - Google SDE
(2, 1, 3, 3, 'My strong programming background and problem-solving abilities make me a good fit for Google.', 'Campus Placement'),
-- Status: Shortlisted, Technical Interview

-- Rahul (CSE) - Amazon Frontend
(3, 6, 3, 3, 'I have extensive experience with React and have built multiple production-level applications.', 'LinkedIn'),
-- Status: Shortlisted

-- Rahul - Flipkart SDE
(3, 7, 2, 2, 'Full-stack development is my passion, and I want to contribute to Flipkart\'s platform.', 'Company Website'),
-- Status: Under Review

-- Rahul - TCS Full Stack
(3, 10, 1, 1, 'I am looking for an opportunity to grow my full-stack skills at TCS.', 'Campus Placement'),
-- Status: Submitted

-- Sneha (IT) - Google SDE
(4, 1, 4, 2, 'My cloud and DevOps expertise combined with strong programming skills make me suitable for this role.', 'LinkedIn'),
-- Status: Rejected

-- Sneha - Amazon SDE
(4, 5, 5, 4, 'I have experience with AWS services and building scalable applications.', 'Company Website'),
-- Status: Selected, HR Interview

-- Sneha - Razorpay SDE
(4, 19, 6, 5, 'I am excited about building banking infrastructure and would bring my cloud expertise to Razorpay.', 'LinkedIn'),
-- Status: Offer Accepted

-- Kunal (IT) - Google Frontend
(5, 2, 2, 2, 'My experience with Angular and Django makes me a strong candidate for frontend roles.', 'Campus Placement'),
-- Status: Under Review

-- Kunal - Flipkart Frontend
(5, 7, 3, 3, 'I have built responsive applications and am passionate about UI/UX.', 'Company Website'),
-- Status: Shortlisted

-- Neha (ECE) - Amazon SDE (ECE eligible)
(6, 5, 2, 2, 'My embedded systems background gives me a unique perspective on software development.', 'LinkedIn'),
-- Status: Under Review

-- Neha - Paytm SDE (ECE eligible)
(6, 17, 1, 1, 'I want to contribute to India\'s digital payment ecosystem with my programming skills.', 'Company Website'),
-- Status: Submitted

-- Vikram (ECE) - TCS Systems Engineer
(7, 9, 4, 2, 'I have strong C++ skills and problem-solving abilities.', 'Campus Placement'),
-- Status: Rejected

-- Vikram - TCS Full Stack
(7, 10, 2, 2, 'I am learning full-stack development and want to apply my skills at TCS.', 'Company Website'),
-- Status: Under Review

-- Raj (ME) - TCS Systems Engineer (eligible for all depts)
(8, 9, 2, 2, 'My problem-solving skills and teamwork experience make me a good candidate for TCS.', 'Campus Placement'),
-- Status: Under Review

-- Raj - Zomato Data Analyst (no dept restriction)
(8, 14, 1, 1, 'I am interested in data analysis and want to contribute to Zomato\'s business decisions.', 'LinkedIn');
-- Status: Submitted

-- Insert interviews for applications that have progressed
INSERT INTO Interview (application_id, interview_date, interview_type_id, interviewer_name, interview_platform, duration_minutes, feedback, score, status_id) VALUES

-- Arjun - Google SDE Interview (application_id = 1)
(1, '2025-03-10 10:00:00', 1, 'Rajesh Kumar (Google)', 'Google Meet', 60, 'Strong DSA skills, good problem-solving approach', 85.5, 2),  -- Completed

-- Arjun - Amazon SDE Interview (application_id = 2)
(2, '2025-03-12 14:30:00', 1, 'Priyanka Singh (Amazon)', 'Amazon Chime', 60, 'Good system design knowledge', 82.0, 2),  -- Completed

-- Divya - Infosys AI/ML Interview (application_id = 9)
(9, '2025-03-15 11:00:00', 1, 'Dr. Anjali Mehta (Infosys)', 'Microsoft Teams', 45, 'Excellent ML knowledge and project experience', 92.0, 2),  -- Completed

-- Divya - Google SDE Interview (application_id = 10)
(10, '2025-03-18 15:00:00', 1, 'Rajesh Kumar (Google)', 'Google Meet', 60, 'Good problem solving, needs improvement in system design', 78.0, 2),  -- Completed

-- Rahul - Amazon Frontend Interview (application_id = 11)
(11, '2025-03-20 10:30:00', 1, 'Vikram Sharma (Amazon)', 'Amazon Chime', 45, 'Strong React skills, good UI understanding', 88.0, 2),  -- Completed

-- Rahul - Flipkart SDE Interview (application_id = 12)
(12, '2025-03-22 14:00:00', 1, 'Neha Gupta (Flipkart)', 'Zoom', 60, 'Full-stack knowledge is impressive', 85.0, 2),  -- Completed

-- Sneha - Amazon SDE Interview (application_id = 15)
(15, '2025-03-16 13:00:00', 1, 'Priyanka Singh (Amazon)', 'Amazon Chime', 60, 'Strong AWS and system design knowledge', 90.0, 2),  -- Completed

-- Sneha - Razorpay SDE Interview (application_id = 16)
(16, '2025-03-14 12:00:00', 1, 'Harshil Mathur (Razorpay)', 'Zoom', 60, 'Outstanding performance, great fit', 94.0, 2),  -- Completed

-- Kunal - Flipkart Frontend Interview (application_id = 18)
(18, '2025-03-24 11:30:00', 2, 'Amit Patel (Flipkart)', 'Flipkart Office, Bangalore', 45, 'Good UI skills, needs more experience with responsive design', 75.0, 2);  -- Completed

-- Insert application status history (tracking changes)
INSERT INTO ApplicationStatusHistory (application_id, old_status_id, new_status_id, changed_by, change_reason, changed_at) VALUES

-- Arjun's Google application: Submitted -> Under Review -> Shortlisted
(1, 1, 2, 'System', 'Application passed initial screening', '2025-02-20 09:00:00'),
(1, 2, 3, 'Rajesh Kumar', 'Selected for technical interview', '2025-02-25 14:30:00'),

-- Arjun's Amazon application: Submitted -> Under Review
(2, 1, 2, 'System', 'Application received', '2025-02-22 10:00:00'),

-- Divya's Microsoft application: Submitted -> Under Review -> Rejected
(8, 1, 2, 'System', 'Application received', '2025-02-18 11:00:00'),
(8, 2, 4, 'Priyanka Singh', 'Failed online assessment', '2025-02-28 16:00:00'),

-- Divya's Infosys application: Submitted -> Under Review -> Shortlisted -> Selected
(9, 1, 2, 'System', 'Application received', '2025-02-20 09:30:00'),
(9, 2, 3, 'Dr. Anjali Mehta', 'Excellent profile, shortlisted for interview', '2025-02-25 11:00:00'),
(9, 3, 5, 'Dr. Anjali Mehta', 'Cleared all rounds, selected for position', '2025-03-16 15:00:00'),

-- Sneha's Razorpay application: Submitted -> Under Review -> Shortlisted -> Selected -> Offer Accepted
(16, 1, 2, 'System', 'Application received', '2025-02-19 10:00:00'),
(16, 2, 3, 'Harshil Mathur', 'Shortlisted for interview', '2025-02-24 12:00:00'),
(16, 3, 5, 'Harshil Mathur', 'Selected after interview round', '2025-03-15 14:00:00'),
(16, 5, 6, 'Sneha Verma', 'Accepted the offer', '2025-03-20 11:00:00');


-- ============================================================
-- SECTION 4.1 : DML — UPDATE AND DELETE
-- ============================================================

-- UPDATE: modify a student's CGPA after re-evaluation
UPDATE Student
SET current_cgpa = 8.8
WHERE enrollment_number = 'CSE2021001';

-- UPDATE: advance an application to Shortlisted (status_id = 3)
UPDATE Application
SET status_id = 3, last_status_update = CURRENT_TIMESTAMP
WHERE application_id = 2;

-- UPDATE: assign HR contact details to a company
UPDATE Company
SET hr_contact_name = 'Ravi Kumar', hr_contact_phone = '9876543210'
WHERE company_name = 'Tech Innovations Inc.';

-- DELETE: remove a specific application
DELETE FROM Application WHERE application_id = 3;

-- DELETE: purge inactive opportunities whose deadline has passed
DELETE FROM InternshipOpportunity
WHERE application_deadline < CURDATE() AND is_active = FALSE;


-- ============================================================
-- SECTION 4.2 : RETRIEVE ALL TABLE DATA (SELECT *)
-- ============================================================
SELECT * FROM Student;
SELECT * FROM Company;
SELECT * FROM InternshipOpportunity;
SELECT * FROM Interview;
SELECT * FROM Skill;
SELECT * FROM Department;
SELECT * FROM EligibilityCriteria;
SELECT * FROM Eligibility_Skill;
SELECT * FROM Application;
SELECT * FROM ApplicationStatusHistory;
SELECT * FROM Student_Skill;
SELECT * FROM Opportunity_Skill;
SELECT * FROM InternshipType;
SELECT * FROM ApplicationStatus;
SELECT * FROM SelectionRound;
SELECT * FROM InterviewType;
SELECT * FROM InterviewStatus;
SELECT * FROM ProficiencyLevel;
SELECT * FROM ImportanceLevel;

-- Department-wise student count (using normalized FK)
SELECT d.department_name, COUNT(s.student_id) AS student_count
FROM Student s
JOIN Department d ON s.department_id = d.department_id
GROUP BY d.department_name;


-- ============================================================
-- SECTION 4.3 : SET OPERATIONS
-- ============================================================

-- UNION: combine student emails and company HR emails (distinct)
SELECT email AS contact_email, 'Student' AS source_type
FROM Student
UNION
SELECT hr_contact_email, 'Company HR' AS source_type
FROM Company
WHERE hr_contact_email IS NOT NULL
ORDER BY source_type, contact_email;

-- UNION ALL: all department references including duplicates
SELECT d.department_name AS dept_name FROM Student s JOIN Department d ON s.department_id = d.department_id
UNION ALL
SELECT d.department_name FROM EligibilityCriteria ec JOIN Department d ON ec.required_department_id = d.department_id
WHERE ec.required_department_id IS NOT NULL
ORDER BY dept_name;

-- NOT IN: students who have NOT applied to any internship
SELECT s.student_id, s.first_name, s.last_name, d.department_name
FROM Student s
JOIN Department d ON s.department_id = d.department_id
WHERE s.student_id NOT IN (SELECT DISTINCT student_id FROM Application);

-- IN: opportunities that have received at least one application
SELECT o.opportunity_id, o.title
FROM InternshipOpportunity o
WHERE o.opportunity_id IN (SELECT DISTINCT opportunity_id FROM Application);


-- ============================================================
-- SECTION 4.4 : SUBQUERIES
-- ============================================================

-- Scalar subquery: get all eligible opportunities for student_id = 1
SELECT
    o.opportunity_id,
    c.company_name,
    o.title,
    it.type_name AS internship_type,
    o.duration_weeks,
    o.stipend_amount,
    o.application_deadline
FROM InternshipOpportunity o
JOIN Company c           ON o.company_id       = c.company_id
JOIN EligibilityCriteria ec ON o.opportunity_id = ec.opportunity_id
JOIN InternshipType it   ON o.internship_type_id = it.type_id
WHERE o.is_active = TRUE
    AND o.application_deadline >= CURDATE()
    AND ec.min_cgpa <= (SELECT current_cgpa FROM Student WHERE student_id = 1)
    AND (ec.required_department_id IS NULL
         OR ec.required_department_id = (SELECT department_id FROM Student WHERE student_id = 1))
ORDER BY o.application_deadline;

-- Correlated subquery: students with more than 1 application
SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    d.department_name,
    (SELECT COUNT(*) FROM Application a WHERE a.student_id = s.student_id) AS application_count
FROM Student s
JOIN Department d ON s.department_id = d.department_id
WHERE (SELECT COUNT(*) FROM Application a WHERE a.student_id = s.student_id) > 1;

-- Derived table subquery: company with the most postings
SELECT c.company_name, opp_count.total_opportunities
FROM Company c
JOIN (
    SELECT company_id, COUNT(*) AS total_opportunities
    FROM InternshipOpportunity
    GROUP BY company_id
) AS opp_count ON c.company_id = opp_count.company_id
ORDER BY opp_count.total_opportunities DESC
LIMIT 1;

-- EXISTS subquery: active companies with at least one active internship
SELECT c.company_id, c.company_name, c.industry
FROM Company c
WHERE EXISTS (
    SELECT 1
    FROM InternshipOpportunity o
    WHERE o.company_id = c.company_id AND o.is_active = TRUE
);

-- Application status statistics with percentage (using normalized status names)
SELECT
    ast.status_name,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM Application a
JOIN ApplicationStatus ast ON a.status_id = ast.status_id
GROUP BY ast.status_name;


-- ============================================================
-- SECTION 4.5 : JOINS (UPDATED FOR NORMALIZED STRUCTURE)
-- ============================================================

-- INNER JOIN: all applications with full student and internship details
SELECT
    s.enrollment_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    o.title         AS internship_title,
    c.company_name,
    ast.status_name AS application_status,
    a.application_date
FROM Application a
INNER JOIN Student               s  ON a.student_id      = s.student_id
INNER JOIN InternshipOpportunity o  ON a.opportunity_id  = o.opportunity_id
INNER JOIN Company               c  ON o.company_id      = c.company_id
INNER JOIN ApplicationStatus     ast ON a.status_id      = ast.status_id
ORDER BY a.application_date DESC;

-- LEFT JOIN: all students including those with zero applications
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    d.department_name,
    s.current_cgpa,
    COUNT(a.application_id) AS total_applications
FROM Student s
LEFT JOIN Department d ON s.department_id = d.department_id
LEFT JOIN Application a ON s.student_id = a.student_id
GROUP BY s.student_id, s.first_name, s.last_name, d.department_name, s.current_cgpa
ORDER BY total_applications DESC;

-- Multi-table JOIN with HAVING: students with 2+ relevant skills
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.current_cgpa,
    d.department_name,
    GROUP_CONCAT(sk.skill_name) AS skills
FROM Student s
JOIN Department d ON s.department_id = d.department_id
JOIN Student_Skill ss ON s.student_id = ss.student_id
JOIN Skill         sk ON ss.skill_id  = sk.skill_id
WHERE sk.skill_name IN ('Python', 'SQL', 'Machine Learning')
GROUP BY s.student_id
HAVING COUNT(DISTINCT sk.skill_name) >= 2
ORDER BY s.current_cgpa DESC;

-- Opportunities joined with eligibility and company info (normalized)
SELECT
    o.title,
    c.company_name,
    it.type_name AS internship_type,
    o.stipend_amount,
    o.application_deadline,
    ec.min_cgpa,
    d.department_name AS required_department
FROM InternshipOpportunity o
JOIN Company               c  ON o.company_id      = c.company_id
JOIN InternshipType        it ON o.internship_type_id = it.type_id
LEFT JOIN EligibilityCriteria ec ON o.opportunity_id = ec.opportunity_id
LEFT JOIN Department       d  ON ec.required_department_id = d.department_id
WHERE o.is_active = TRUE
ORDER BY o.application_deadline;

-- CROSS JOIN: student eligibility check against all active opportunities (normalized)
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.current_cgpa,
    d.department_name AS student_department,
    o.title         AS opportunity_title,
    c.company_name,
    CASE
        WHEN s.current_cgpa >= ec.min_cgpa
             AND (ec.required_department_id IS NULL OR s.department_id = ec.required_department_id)
        THEN 'Eligible'
        ELSE 'Not Eligible'
    END AS eligibility_status
FROM Student s
CROSS JOIN InternshipOpportunity o
JOIN Company               c  ON o.company_id      = c.company_id
JOIN EligibilityCriteria   ec ON o.opportunity_id  = ec.opportunity_id
JOIN Department            d  ON s.department_id   = d.department_id
WHERE o.is_active = TRUE AND o.application_deadline >= CURDATE();


-- ============================================================
-- SECTION 5 : VIEWS (UPDATED FOR NORMALIZED STRUCTURE)
-- ============================================================
-- A VIEW is a stored SELECT query treated as a virtual table.
-- ============================================================

-- View 1: ActiveOpportunities
-- Shows all live internship postings with eligibility thresholds
CREATE OR REPLACE VIEW ActiveOpportunities AS
SELECT
    o.opportunity_id,
    c.company_name,
    o.title,
    it.type_name AS internship_type,
    o.application_deadline,
    o.duration_weeks,
    o.stipend_amount,
    ec.min_cgpa,
    d.department_name AS required_department,
    (SELECT GROUP_CONCAT(skill_name) 
     FROM Eligibility_Skill es 
     JOIN Skill sk ON es.skill_id = sk.skill_id 
     WHERE es.criteria_id = ec.criteria_id) AS required_skills
FROM InternshipOpportunity o
JOIN Company               c  ON o.company_id      = c.company_id
JOIN InternshipType        it ON o.internship_type_id = it.type_id
LEFT JOIN EligibilityCriteria ec ON o.opportunity_id = ec.opportunity_id
LEFT JOIN Department       d  ON ec.required_department_id = d.department_id
WHERE o.is_active = TRUE
    AND o.application_deadline >= CURDATE();

-- View 2: StudentApplications
-- Consolidates student details, company, and application status
CREATE OR REPLACE VIEW StudentApplications AS
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.enrollment_number,
    s.current_cgpa,
    d.department_name,
    c.company_name,
    o.title    AS opportunity_title,
    ast.status_name AS application_status,
    a.application_date,
    sr.round_name AS selection_round
FROM Application a
JOIN Student               s  ON a.student_id      = s.student_id
JOIN Department           d  ON s.department_id    = d.department_id
JOIN InternshipOpportunity o  ON a.opportunity_id  = o.opportunity_id
JOIN Company               c  ON o.company_id      = c.company_id
JOIN ApplicationStatus    ast ON a.status_id       = ast.status_id
JOIN SelectionRound       sr  ON a.selection_round_id = sr.round_id;

-- View 3: StudentEligibilityCheck
-- Cross-checks every student against every active opening
CREATE OR REPLACE VIEW StudentEligibilityCheck AS
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.current_cgpa,
    d.department_name AS student_department,
    o.title        AS opportunity_title,
    c.company_name,
    CASE
        WHEN s.current_cgpa >= ec.min_cgpa
             AND (ec.required_department_id IS NULL OR s.department_id = ec.required_department_id)
        THEN 'Eligible'
        ELSE 'Not Eligible'
    END AS eligibility_status
FROM Student s
CROSS JOIN InternshipOpportunity o
JOIN Company               c  ON o.company_id      = c.company_id
JOIN EligibilityCriteria   ec ON o.opportunity_id  = ec.opportunity_id
JOIN Department            d  ON s.department_id   = d.department_id
WHERE o.is_active = TRUE AND o.application_deadline >= CURDATE();


-- ============================================================
-- SECTION 6 : CONCURRENCY CONTROL & RECOVERY MECHANISMS
-- ============================================================

-- ============================================================
-- 6.1 : ISOLATION LEVELS AND LOCKING MECHANISMS
-- ============================================================

-- Set default isolation level to REPEATABLE READ (MySQL default)
-- This prevents dirty reads, non-repeatable reads, and phantom reads

-- Example: Setting session isolation level to SERIALIZABLE for critical operations
-- SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- ============================================================
-- 6.2 : PESSIMISTIC LOCKING WITH SELECT ... FOR UPDATE
-- ============================================================

DELIMITER //

-- Procedure to safely update application status with row-level locking
CREATE PROCEDURE SafeUpdateApplicationStatus(
    IN p_application_id INT,
    IN p_new_status_name VARCHAR(50),
    IN p_change_reason TEXT,
    IN p_changed_by VARCHAR(50)
)
BEGIN
    DECLARE v_current_status_id INT;
    DECLARE v_new_status_id INT;
    DECLARE v_is_final BOOLEAN;
    
    -- Start transaction with REPEATABLE READ isolation
    START TRANSACTION;
    
    -- Acquire exclusive row lock on the application
    SELECT status_id INTO v_current_status_id
    FROM Application
    WHERE application_id = p_application_id
    FOR UPDATE;
    
    -- Check if current status is final (cannot change final status)
    SELECT is_final INTO v_is_final
    FROM ApplicationStatus
    WHERE status_id = v_current_status_id;
    
    IF v_is_final = TRUE THEN
        ROLLBACK;
        SELECT 'Cannot update: Application is in final state' AS error_message;
    ELSE
        -- Get new status ID
        SELECT status_id INTO v_new_status_id
        FROM ApplicationStatus
        WHERE status_name = p_new_status_name;
        
        IF v_new_status_id IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status name';
        ELSE
            -- Update application status
            UPDATE Application
            SET status_id = v_new_status_id,
                last_status_update = CURRENT_TIMESTAMP
            WHERE application_id = p_application_id;
            
            -- Insert audit record
            INSERT INTO ApplicationStatusHistory
                (application_id, old_status_id, new_status_id, change_reason, changed_by)
            VALUES
                (p_application_id, v_current_status_id, v_new_status_id, p_change_reason, p_changed_by);
            
            COMMIT;
            SELECT 'Status updated successfully' AS message;
        END IF;
    END IF;
END//

-- Procedure to apply for internship with locking to prevent duplicate applications
CREATE PROCEDURE ApplyWithLocking(
    IN p_student_id INT,
    IN p_opportunity_id INT,
    IN p_cover_letter TEXT,
    IN p_applied_via VARCHAR(50)
)
BEGIN
    DECLARE v_application_exists INT;
    DECLARE v_is_eligible INT;
    DECLARE v_deadline DATE;
    DECLARE v_current_applications INT;
    DECLARE v_max_applications INT;
    
    START TRANSACTION;
    
    -- Lock the opportunity to check capacity (prevent race conditions)
    SELECT application_deadline, max_applications INTO v_deadline, v_max_applications
    FROM InternshipOpportunity
    WHERE opportunity_id = p_opportunity_id
    FOR UPDATE;
    
    -- Check deadline
    IF v_deadline < CURDATE() THEN
        ROLLBACK;
        SELECT 'Cannot apply: Application deadline has passed' AS error_message;
    ELSE
        -- Check capacity
        SELECT COUNT(*) INTO v_current_applications
        FROM Application
        WHERE opportunity_id = p_opportunity_id;
        
        IF v_max_applications IS NOT NULL AND v_current_applications >= v_max_applications THEN
            ROLLBACK;
            SELECT 'Cannot apply: Maximum applications reached for this opportunity' AS error_message;
        ELSE
            -- Check for duplicate application
            SELECT COUNT(*) INTO v_application_exists
            FROM Application
            WHERE student_id = p_student_id AND opportunity_id = p_opportunity_id
            FOR UPDATE;
            
            IF v_application_exists > 0 THEN
                ROLLBACK;
                SELECT 'You have already applied for this opportunity' AS error_message;
            ELSE
                -- Check eligibility
                SELECT COUNT(*) INTO v_is_eligible
                FROM Student s
                JOIN EligibilityCriteria ec ON ec.opportunity_id = p_opportunity_id
                WHERE s.student_id = p_student_id
                  AND s.current_cgpa >= ec.min_cgpa
                  AND (ec.required_department_id IS NULL OR s.department_id = ec.required_department_id);
                
                IF v_is_eligible = 0 THEN
                    ROLLBACK;
                    SELECT 'You are not eligible for this opportunity' AS error_message;
                ELSE
                    INSERT INTO Application (student_id, opportunity_id, cover_letter, applied_via, status_id, selection_round_id)
                    VALUES (p_student_id, p_opportunity_id, p_cover_letter, p_applied_via, 1, 1);
                    
                    COMMIT;
                    SELECT 'Application submitted successfully' AS message;
                END IF;
            END IF;
        END IF;
    END IF;
END//

DELIMITER ;

-- ============================================================
-- 6.3 : OPTIMISTIC LOCKING WITH VERSION COLUMN
-- ============================================================

-- Add version column to Application table for optimistic locking
ALTER TABLE Application ADD COLUMN version_no INT DEFAULT 0;

-- Procedure for optimistic locking update
DELIMITER //

CREATE PROCEDURE OptimisticUpdateStatus(
    IN p_application_id INT,
    IN p_expected_version INT,
    IN p_new_status_name VARCHAR(50)
)
BEGIN
    DECLARE v_updated_count INT;
    DECLARE v_new_status_id INT;
    
    -- Get new status ID
    SELECT status_id INTO v_new_status_id
    FROM ApplicationStatus
    WHERE status_name = p_new_status_name;
    
    START TRANSACTION;
    
    -- Update only if version matches
    UPDATE Application
    SET status_id = v_new_status_id,
        version_no = version_no + 1,
        last_status_update = CURRENT_TIMESTAMP
    WHERE application_id = p_application_id
      AND version_no = p_expected_version;
    
    SET v_updated_count = ROW_COUNT();
    
    IF v_updated_count = 0 THEN
        ROLLBACK;
        SELECT 'Update failed: Record was modified by another transaction. Please retry.' AS error_message;
    ELSE
        COMMIT;
        SELECT 'Status updated successfully with optimistic locking' AS message;
    END IF;
END//

DELIMITER ;

-- ============================================================
-- 6.4 : DEADLOCK HANDLING WITH RETRY LOGIC
-- ============================================================

DELIMITER //

CREATE PROCEDURE DeadlockSafeOperation(
    IN p_student_id INT,
    IN p_opportunity_id INT
)
BEGIN
    DECLARE v_deadlock INT DEFAULT 0;
    DECLARE v_retry_count INT DEFAULT 0;
    DECLARE v_max_retries INT DEFAULT 3;
    
    WHILE v_retry_count < v_max_retries DO
        BEGIN
            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                GET DIAGNOSTICS CONDITION 1
                    v_deadlock = MYSQL_ERRNO;
                IF v_deadlock = 1213 THEN  -- Deadlock error code
                    SET v_retry_count = v_retry_count + 1;
                    DO SLEEP(0.1);  -- Wait before retry
                    ROLLBACK;
                ELSE
                    SELECT 'Unexpected error occurred' AS error_message;
                    SET v_retry_count = v_max_retries;
                END IF;
            END;
            
            START TRANSACTION;
            
            -- Perform the operation here
            INSERT INTO Application (student_id, opportunity_id, status_id, selection_round_id)
            VALUES (p_student_id, p_opportunity_id, 1, 1)
            ON DUPLICATE KEY UPDATE
                application_date = application_date;  -- No-op if duplicate
            
            COMMIT;
            SET v_retry_count = v_max_retries;  -- Exit loop on success
            
        END;
    END WHILE;
    
    IF v_deadlock = 1213 THEN
        SELECT 'Operation failed due to repeated deadlocks. Please try again later.' AS error_message;
    ELSE
        SELECT 'Operation completed successfully' AS message;
    END IF;
END//

DELIMITER ;

-- ============================================================
-- 6.5 : RECOVERY MECHANISMS
-- ============================================================

-- ============================================================
-- 6.5.1 : CHANGE DATA CAPTURE (CDC) TABLE FOR AUDIT
-- ============================================================

CREATE TABLE ApplicationChangeLog (
    change_id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT,
    old_status_id INT,
    new_status_id INT,
    old_version INT,
    new_version INT,
    changed_by VARCHAR(100),
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_id VARCHAR(50),
    INDEX idx_app_changes (application_id, change_timestamp)
);

-- Trigger to capture all changes for recovery
DELIMITER //

CREATE TRIGGER ApplicationChangeLogTrigger
AFTER UPDATE ON Application
FOR EACH ROW
BEGIN
    INSERT INTO ApplicationChangeLog
        (application_id, old_status_id, new_status_id, old_version, new_version, changed_by, transaction_id)
    VALUES
        (NEW.application_id, OLD.status_id, NEW.status_id, OLD.version_no, NEW.version_no, 
         USER(), CONNECTION_ID());
END//

DELIMITER ;

-- ============================================================
-- 6.5.2 : POINT-IN-TIME RECOVERY PROCEDURE
-- ============================================================

DELIMITER //

CREATE PROCEDURE RecoverApplicationState(
    IN p_application_id INT,
    IN p_target_time TIMESTAMP
)
BEGIN
    DECLARE v_target_status_id INT;
    DECLARE v_target_version INT;
    DECLARE v_current_status_id INT;
    
    START TRANSACTION;
    
    -- Get the state at target time
    SELECT new_status_id, new_version 
    INTO v_target_status_id, v_target_version
    FROM ApplicationChangeLog
    WHERE application_id = p_application_id
      AND change_timestamp <= p_target_time
    ORDER BY change_timestamp DESC
    LIMIT 1;
    
    IF v_target_status_id IS NULL THEN
        -- No changes before target time, get initial state
        SELECT status_id, version_no 
        INTO v_target_status_id, v_target_version
        FROM Application
        WHERE application_id = p_application_id;
    END IF;
    
    -- Get current state
    SELECT status_id, version_no 
    INTO v_current_status_id, v_target_version
    FROM Application
    WHERE application_id = p_application_id
    FOR UPDATE;
    
    -- Revert to target state
    UPDATE Application
    SET status_id = v_target_status_id,
        last_status_update = CURRENT_TIMESTAMP,
        remarks = CONCAT('Recovered to state as of ', p_target_time, '. Previous status was: ', 
                        (SELECT status_name FROM ApplicationStatus WHERE status_id = v_current_status_id))
    WHERE application_id = p_application_id;
    
    -- Log the recovery action
    INSERT INTO ApplicationChangeLog
        (application_id, old_status_id, new_status_id, old_version, new_version, changed_by, transaction_id)
    VALUES
        (p_application_id, v_current_status_id, v_target_status_id, 
         (SELECT version_no FROM Application WHERE application_id = p_application_id), 
         (SELECT version_no FROM Application WHERE application_id = p_application_id) + 1,
         'RECOVERY_SYSTEM', CONNECTION_ID());
    
    COMMIT;
    
    SELECT CONCAT('Application ', p_application_id, ' recovered to state as of ', p_target_time) AS recovery_message;
END//

DELIMITER ;

-- ============================================================
-- 6.5.3 : CHECKPOINT AND SAVEPOINT USAGE PROCEDURE
-- ============================================================

DELIMITER //

CREATE PROCEDURE BatchApplicationUpdateWithSavepoint()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK TO SAVEPOINT batch_savepoint;
        SELECT 'Batch update failed. Rolled back to savepoint.' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- Create savepoint before batch operations
    SAVEPOINT batch_savepoint;
    
    -- Batch operation 1: Update all shortlisted applications to interview stage
    UPDATE Application 
    SET selection_round_id = 3,
        last_status_update = CURRENT_TIMESTAMP,
        remarks = CONCAT(IFNULL(remarks, ''), ' | Advanced to Technical Interview stage')
    WHERE status_id = 3;  -- Shortlisted
    
    -- Batch operation 2: Update interview schedules
    INSERT INTO Interview (application_id, interview_date, interview_type_id, status_id)
    SELECT application_id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1, 1
    FROM Application
    WHERE status_id = 3
      AND application_id NOT IN (SELECT DISTINCT application_id FROM Interview);
    
    -- If everything is fine, commit
    COMMIT;
    SELECT 'Batch update completed successfully' AS message;
END//

DELIMITER ;

-- ============================================================
-- 6.6 : PERFORMANCE MONITORING VIEWS
-- ============================================================

-- View to monitor lock waits
CREATE OR REPLACE VIEW LockWaitMonitor AS
SELECT 
    r.ENGINE_TRANSACTION_ID AS waiting_trx_id,
    t1.PROCESSLIST_ID AS waiting_thread,
    t1.PROCESSLIST_INFO AS waiting_query,
    b.ENGINE_TRANSACTION_ID AS blocking_trx_id,
    t2.PROCESSLIST_ID AS blocking_thread,
    t2.PROCESSLIST_INFO AS blocking_query
FROM performance_schema.data_lock_waits w
JOIN performance_schema.data_locks r 
    ON w.REQUESTING_ENGINE_LOCK_ID = r.ENGINE_LOCK_ID
JOIN performance_schema.data_locks b 
    ON w.BLOCKING_ENGINE_LOCK_ID = b.ENGINE_LOCK_ID
LEFT JOIN performance_schema.threads t1 
    ON r.THREAD_ID = t1.THREAD_ID
LEFT JOIN performance_schema.threads t2 
    ON b.THREAD_ID = t2.THREAD_ID;

-- View to monitor transaction status
CREATE OR REPLACE VIEW TransactionMonitor AS
SELECT 
    trx_id,
    trx_state,
    trx_started,
    trx_requested_lock_id,
    trx_wait_started,
    trx_mysql_thread_id,
    TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS running_seconds,
    trx_query
FROM information_schema.innodb_trx;

-- ============================================================
-- SECTION 6.7 : USER-DEFINED FUNCTION (UPDATED)
-- ============================================================
DELIMITER //

CREATE FUNCTION GetStudentFullName(p_student_id INT)
RETURNS VARCHAR(150)
DETERMINISTIC
BEGIN
    DECLARE full_name VARCHAR(150);

    SELECT CONCAT(first_name, ' ', last_name)
    INTO   full_name
    FROM   Student
    WHERE  student_id = p_student_id;

    RETURN full_name;
END//

DELIMITER ;


-- ============================================================
-- SECTION 6.8 : STORED PROCEDURES (UPDATED FOR NORMALIZED STRUCTURE)
-- ============================================================

DELIMITER //

-- Procedure 1: ApplyForInternship (updated with normalized FK checks)
CREATE PROCEDURE ApplyForInternship(
    IN p_student_id    INT,
    IN p_opportunity_id INT,
    IN p_cover_letter  TEXT,
    IN p_applied_via   VARCHAR(50)
)
BEGIN
    DECLARE v_is_eligible      INT DEFAULT 0;
    DECLARE v_application_count INT;

    -- Step 1: verify student meets CGPA and department criteria
    SELECT COUNT(*)
    INTO   v_is_eligible
    FROM   Student s
    JOIN   EligibilityCriteria ec ON ec.opportunity_id = p_opportunity_id
    WHERE  s.student_id   = p_student_id
      AND  s.current_cgpa >= ec.min_cgpa
      AND  (ec.required_department_id IS NULL
            OR s.department_id = ec.required_department_id);

    -- Step 2: check if the student has already applied
    SELECT COUNT(*)
    INTO   v_application_count
    FROM   Application
    WHERE  student_id    = p_student_id
      AND  opportunity_id = p_opportunity_id;

    -- Step 3: conditional insert
    IF v_is_eligible > 0 AND v_application_count = 0 THEN
        INSERT INTO Application (student_id, opportunity_id, cover_letter, applied_via, status_id, selection_round_id)
        VALUES (p_student_id, p_opportunity_id, p_cover_letter, p_applied_via, 1, 1);
        SELECT 'Application submitted successfully' AS message;
    ELSEIF v_application_count > 0 THEN
        SELECT 'You have already applied for this opportunity' AS message;
    ELSE
        SELECT 'You are not eligible for this opportunity' AS message;
    END IF;
END//

-- Procedure 2: UpdateApplicationStatus (updated with normalized status IDs)
CREATE PROCEDURE UpdateApplicationStatus(
    IN p_application_id INT,
    IN p_new_status_name VARCHAR(50),
    IN p_change_reason   TEXT,
    IN p_changed_by      VARCHAR(50)
)
BEGIN
    DECLARE v_old_status_id INT;
    DECLARE v_new_status_id INT;

    -- Get the new status ID from the lookup table
    SELECT status_id INTO v_new_status_id
    FROM ApplicationStatus
    WHERE status_name = p_new_status_name;

    IF v_new_status_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status name';
    END IF;

    -- Capture current status before overwriting
    SELECT status_id
    INTO   v_old_status_id
    FROM   Application
    WHERE  application_id = p_application_id;

    -- Apply the status change
    UPDATE Application
    SET    status_id          = v_new_status_id,
           last_status_update = CURRENT_TIMESTAMP
    WHERE  application_id = p_application_id;

    -- Write the audit record
    INSERT INTO ApplicationStatusHistory
        (application_id, old_status_id, new_status_id, change_reason, changed_by)
    VALUES
        (p_application_id, v_old_status_id, v_new_status_id, p_change_reason, p_changed_by);

    SELECT 'Status updated successfully' AS message;
END//

DELIMITER ;


-- ============================================================
-- SECTION 6.9 : TRIGGERS (UPDATED FOR NORMALIZED STRUCTURE)
-- ============================================================

DELIMITER //

-- Trigger 1: BeforeApplicationInsert (BEFORE INSERT)
CREATE TRIGGER BeforeApplicationInsert
BEFORE INSERT ON Application
FOR EACH ROW
BEGIN
    DECLARE v_deadline DATE;

    SELECT application_deadline
    INTO   v_deadline
    FROM   InternshipOpportunity
    WHERE  opportunity_id = NEW.opportunity_id;

    IF v_deadline < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot apply: Application deadline has passed';
    END IF;
END//

-- Trigger 2: AfterApplicationStatusUpdate (AFTER UPDATE - normalized)
CREATE TRIGGER AfterApplicationStatusUpdate
AFTER UPDATE ON Application
FOR EACH ROW
BEGIN
    IF OLD.status_id != NEW.status_id THEN
        INSERT INTO ApplicationStatusHistory
            (application_id, old_status_id, new_status_id, changed_by)
        VALUES
            (NEW.application_id, OLD.status_id, NEW.status_id, 'System');
    END IF;
END//

DELIMITER ;


-- ============================================================
-- SECTION 6.10 : CURSOR (UPDATED)
-- ============================================================

DELIMITER //

CREATE PROCEDURE ListAllStudents()
BEGIN
    DECLARE done         INT     DEFAULT FALSE;
    DECLARE v_student_id INT;
    DECLARE v_name       VARCHAR(100);
    DECLARE v_cgpa       DECIMAL(3,2);
    DECLARE v_dept_name  VARCHAR(100);

    DECLARE cur_students CURSOR FOR
        SELECT s.student_id,
               CONCAT(s.first_name, ' ', s.last_name),
               s.current_cgpa,
               d.department_name
        FROM   Student s
        JOIN   Department d ON s.department_id = d.department_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 'Error occurred while fetching student data' AS message;
    END;

    OPEN cur_students;

    read_loop: LOOP
        FETCH cur_students INTO v_student_id, v_name, v_cgpa, v_dept_name;

        IF done THEN
            LEAVE read_loop;
        END IF;

        SELECT v_student_id AS student_id,
               v_name       AS student_name,
               v_cgpa       AS cgpa,
               v_dept_name  AS department;
    END LOOP;

    CLOSE cur_students;
END//

DELIMITER ;


-- ============================================================
-- SECTION 6.11 : EXCEPTION HANDLING (UPDATED FOR NORMALIZED STRUCTURE)
-- ============================================================

DELIMITER //

CREATE PROCEDURE SafeApplyForInternship(
    IN p_student_id     INT,
    IN p_opportunity_id INT
)
BEGIN
    DECLARE v_min_cgpa        DECIMAL(3,2);
    DECLARE v_student_cgpa    DECIMAL(3,2);
    DECLARE v_dept_required_id INT;
    DECLARE v_student_dept_id  INT;
    DECLARE done              INT DEFAULT FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
    BEGIN
        SET done = TRUE;
        SELECT 'Internship opportunity or student record not found.' AS error_message;
    END;

    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 'An unexpected error occurred. Please try again.' AS error_message;
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT current_cgpa, department_id
    INTO   v_student_cgpa, v_student_dept_id
    FROM   Student
    WHERE  student_id = p_student_id;

    SELECT min_cgpa, required_department_id
    INTO   v_min_cgpa, v_dept_required_id
    FROM   EligibilityCriteria
    WHERE  opportunity_id = p_opportunity_id;

    IF done THEN
        ROLLBACK;

    ELSEIF v_student_cgpa < v_min_cgpa THEN
        SELECT 'Not eligible: CGPA below minimum requirement.' AS result;
        ROLLBACK;

    ELSEIF v_dept_required_id IS NOT NULL AND v_student_dept_id != v_dept_required_id THEN
        SELECT 'Not eligible: Department mismatch.' AS result;
        ROLLBACK;

    ELSE
        INSERT INTO Application (student_id, opportunity_id, status_id, selection_round_id)
        VALUES (p_student_id, p_opportunity_id, 1, 1);

        SELECT 'Application submitted successfully.' AS result;
        COMMIT;
    END IF;
END//

DELIMITER ;


-- ============================================================
-- SECTION 7 : AUTHENTICATION (JWT + ROLE-BASED ACCESS CONTROL)
-- ============================================================

-- ============================================================
-- 7.1 ROLE TABLE (RBAC FOUNDATION)
-- ============================================================

CREATE TABLE Role (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO Role (role_name) VALUES
('Student'),
('Admin'),
('Company');

SELECT * FROM Role;


-- ============================================================
-- 7.2 USER TABLE (AUTHENTICATION CORE)
-- ============================================================

CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES Role(role_id)
);

-- Index for faster login queries
CREATE INDEX idx_user_email ON User(email);


-- ============================================================
-- 7.3 LINK USER WITH EXISTING ENTITIES
-- ============================================================

-- Link User → Student
ALTER TABLE Student
ADD COLUMN user_id INT UNIQUE,
ADD CONSTRAINT fk_student_user
FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE;

-- Link User → Company
ALTER TABLE Company
ADD COLUMN user_id INT UNIQUE,
ADD CONSTRAINT fk_company_user
FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE;


-- ============================================================
-- 7.4 ADMIN TABLE (FOR PLATFORM ADMINS)
-- ============================================================

CREATE TABLE Admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    admin_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);


-- ============================================================
-- 7.5 LOGIN HISTORY (AUDIT & SECURITY)
-- ============================================================

CREATE TABLE LoginHistory (
    login_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),

    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_login_user ON LoginHistory(user_id);


-- ============================================================
-- 7.6 OPTIONAL: PERMISSIONS (ADVANCED RBAC)
-- ============================================================

CREATE TABLE Permission (
    permission_id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Role_Permission (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),

    FOREIGN KEY (role_id) REFERENCES Role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permission(permission_id) ON DELETE CASCADE
);

-- Sample permissions
INSERT INTO Permission (permission_name) VALUES
('APPLY_INTERNSHIP'),
('VIEW_APPLICATIONS'),
('CREATE_OPPORTUNITY'),
('MANAGE_USERS'),
('UPDATE_APPLICATION_STATUS');

-- Map permissions to roles
INSERT INTO Role_Permission (role_id, permission_id) VALUES
-- Student
(1, 1),  -- APPLY_INTERNSHIP
(1, 2),  -- VIEW_APPLICATIONS

-- Company
(3, 3),  -- CREATE_OPPORTUNITY
(3, 2),  -- VIEW_APPLICATIONS
(3, 5),  -- UPDATE_APPLICATION_STATUS

-- Admin
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5);


-- ============================================================
-- 7.7 HELPER VIEW (FOR JWT LOGIN RESPONSE)
-- ============================================================

CREATE OR REPLACE VIEW UserAuthView AS
SELECT
    u.user_id,
    u.email,
    u.password_hash,
    r.role_name,
    u.is_active
FROM User u
JOIN Role r ON u.role_id = r.role_id;


-- ============================================================
-- 7.8 TRIGGER: UPDATE LAST LOGIN
-- ============================================================

DELIMITER //

CREATE TRIGGER AfterUserLogin
AFTER INSERT ON LoginHistory
FOR EACH ROW
BEGIN
    UPDATE User
    SET last_login = NEW.login_time
    WHERE user_id = NEW.user_id;
END//

DELIMITER ;


-- ============================================================
-- 7.9 SAMPLE USER INSERTS (FOR TESTING)
-- NOTE: Replace password_hash with bcrypt hashes from backend
-- ============================================================

-- Example:
-- password = "password123" → hash using bcrypt in backend

INSERT INTO User (email, password_hash, role_id) VALUES
('arjun.reddy@university.edu', '$2b$12$examplehashstudent1', 1),
('divya.sharma@university.edu', '$2b$12$examplehashstudent2', 1),
('rahul.patel@university.edu', '$2b$12$examplehashstudent3', 1),
('sneha.verma@university.edu', '$2b$12$examplehashstudent4', 1),
('admin1@gmail.com',   '$2b$12$examplehashadmin',   2),
('hr@google.co.in', '$2b$12$examplehashcompany', 3),
('hr@microsoft.co.in', '$2b$12$examplehashcompany', 3),
('hr@amazon.co.in', '$2b$12$examplehashcompany', 3);

-- Link users to students
UPDATE Student SET user_id = 1 WHERE email = 'arjun.reddy@university.edu';
UPDATE Student SET user_id = 2 WHERE email = 'divya.sharma@university.edu';
UPDATE Student SET user_id = 3 WHERE email = 'rahul.patel@university.edu';
UPDATE Student SET user_id = 4 WHERE email = 'sneha.verma@university.edu';

-- Link users to companies
UPDATE Company SET user_id = 5 WHERE company_id = 1;  -- Google
UPDATE Company SET user_id = 6 WHERE company_id = 2;  -- Microsoft
UPDATE Company SET user_id = 7 WHERE company_id = 3;  -- Amazon

-- Insert admin
INSERT INTO Admin (user_id, admin_name) VALUES (5, 'System Administrator');

-- ============================================================
-- END OF SQL SCRIPT
-- ============================================================