# Internship and Placement Opportunity Tracker - Database System

## 📋 Overview

This SQL script implements a comprehensive **Internship and Placement Opportunity Tracker** database system. It is designed to manage the entire lifecycle of internship placements, from student registration and opportunity posting to application tracking and interview management.

The system supports **three user roles**:
- **Students** - Browse opportunities, apply for internships, track application status
- **Companies** - Post internship opportunities, manage applications, schedule interviews
- **Admins** - Oversee the entire platform, manage users, generate reports

---

## 🗂️ Database Structure

### Core Components

| Component | Description |
|-----------|-------------|
| **Lookup Tables** | Normalized reference data (internship types, statuses, skill levels) |
| **Strong Entities** | Core business entities (Students, Companies, Opportunities) |
| **Weak Entities** | Dependent entities (Eligibility criteria, Applications, Interviews) |
| **Relationship Tables** | Many-to-many mappings (Student-Skills, Opportunity-Skills) |
| **Security Tables** | Authentication and authorization (Users, Roles, Permissions) |

### Entity Relationship Highlights

```
Student ──┬── Application ──┬── InternshipOpportunity ── Company
          │                  │
          ├── Student_Skill  ├── Opportunity_Skill
          │                  │
          └── Interview       └── EligibilityCriteria
```

---

## 📊 Key Tables

### Business Entities
- `Student` - Student profiles with academic details
- `Company` - Employer information
- `InternshipOpportunity` - Internship postings
- `Application` - Student applications with status tracking
- `Interview` - Interview scheduling and feedback

### Lookup Tables
- `InternshipType` - Summer, Winter, Semester, Year-round
- `ApplicationStatus` - Submitted, Under Review, Selected, Rejected, etc.
- `SelectionRound` - Application, Online Test, Technical, HR, Final
- `ProficiencyLevel` - Beginner to Expert
- `ImportanceLevel` - Required, Preferred, Optional

### Security Tables
- `User` - Authentication credentials
- `Role` - Student, Admin, Company
- `Permission` - Fine-grained access control
- `LoginHistory` - Audit trail for logins

---

## 🔧 Features

### 1. Data Management
- Fully normalized schema (3NF)
- Comprehensive foreign key constraints
- Cascading deletes where appropriate
- Data integrity checks (CHECK constraints)

### 2. Query Capabilities
- **Complex JOINs** - Multi-table relationships
- **Subqueries** - Scalar, correlated, derived table
- **Set Operations** - UNION, UNION ALL, IN, NOT IN
- **Views** - Pre-defined complex queries:
  - `ActiveOpportunities` - Live internship postings
  - `StudentApplications` - Complete application details
  - `StudentEligibilityCheck` - Cross-check eligibility
  - `UserAuthView` - JWT authentication helper

### 3. Concurrency Control
- **Pessimistic Locking** - `SELECT ... FOR UPDATE` in procedures
- **Optimistic Locking** - Version column with retry logic
- **Deadlock Handling** - Automatic retry mechanism
- **Isolation Levels** - Configurable transaction isolation

### 4. Recovery Mechanisms
- **Change Data Capture** - `ApplicationChangeLog` table
- **Point-in-Time Recovery** - `RecoverApplicationState` procedure
- **Savepoints** - Batch operations with rollback points
- **Audit Triggers** - Automatic history tracking

### 5. Security (JWT + RBAC)
- Role-based access control (RBAC)
- Permission-based authorization
- Login history tracking
- User-entity linking (Student/Company/Admin)

### 6. Automation
- **Stored Procedures** - Application submission, status updates
- **Triggers** - Deadline validation, audit logging
- **Functions** - Utility functions (e.g., `GetStudentFullName`)
- **Cursors** - Iterative data processing

---

## 📝 Sample Stored Procedures

| Procedure | Purpose |
|-----------|---------|
| `ApplyForInternship` | Submit new application with eligibility check |
| `UpdateApplicationStatus` | Change status with audit trail |
| `SafeUpdateApplicationStatus` | Pessimistic locking version |
| `OptimisticUpdateStatus` | Version-based optimistic locking |
| `RecoverApplicationState` | Point-in-time recovery |
| `BatchApplicationUpdateWithSavepoint` | Batch operations with rollback |

---

## 🔐 Authentication & Authorization

### JWT Integration Points
The database is designed to work with a backend JWT authentication system:

1. **Login Flow**:
   - User provides email/password
   - Backend validates against `UserAuthView`
   - JWT token generated with role claims

2. **Role Claims in JWT**:
```json
{
  "user_id": 1,
  "email": "student@example.com",
  "role": "Student",
  "permissions": ["APPLY_INTERNSHIP", "VIEW_APPLICATIONS"]
}
```

3. **Database Integration**:
   - `UserAuthView` for authentication queries
   - `LoginHistory` for audit logging
   - `AfterUserLogin` trigger updates last login timestamp

### Permission Matrix

| Permission | Student | Company | Admin |
|------------|---------|---------|-------|
| APPLY_INTERNSHIP | ✅ | ❌ | ✅ |
| VIEW_APPLICATIONS | ✅ | ✅ | ✅ |
| CREATE_OPPORTUNITY | ❌ | ✅ | ✅ |
| UPDATE_APPLICATION_STATUS | ❌ | ✅ | ✅ |
| MANAGE_USERS | ❌ | ❌ | ✅ |

---

## 📈 Sample Data

The script includes realistic sample data:
- **6 departments** (CSE, ECE, ME, CE, IT, EE)
- **24 skills** (Programming, Web Dev, Databases, Cloud, AI/ML)
- **10 companies** (Google, Microsoft, Amazon, Flipkart, TCS, etc.)
- **8 students** with varied skill profiles
- **20 internship opportunities** with eligibility criteria
- **19 applications** with various statuses
- **10 interviews** with feedback and scores

---

## 🚀 Usage Examples

### Basic Queries

```sql
-- View all active opportunities
SELECT * FROM ActiveOpportunities;

-- Check student's application status
SELECT * FROM StudentApplications WHERE student_id = 1;

-- Find eligible opportunities for a student
SELECT * FROM StudentEligibilityCheck WHERE student_id = 1 AND eligibility_status = 'Eligible';
```

### Applying for Internship

```sql
CALL ApplyForInternship(1, 5, 'I am very interested...', 'LinkedIn');
```

### Updating Application Status

```sql
CALL UpdateApplicationStatus(1, 'Shortlisted', 'Passed screening', 'HR Team');
```

### Safe Update with Locking

```sql
CALL SafeUpdateApplicationStatus(1, 'Selected', 'Cleared all rounds', 'Admin');
```

---

## 🛡️ Error Handling

The system includes comprehensive error handling:

| Error Type | Handling Mechanism |
|------------|-------------------|
| Duplicate applications | Unique constraint + validation |
| Past deadlines | Trigger validation |
| Eligibility failure | Pre-insert check |
| Deadlocks | Automatic retry (3 attempts) |
| Invalid status | SIGNAL SQLSTATE |
| Record version mismatch | Optimistic locking rollback |

---

## 📊 Monitoring Views

```sql
-- Monitor current locks and waits
SELECT * FROM LockWaitMonitor;

-- View active transactions
SELECT * FROM TransactionMonitor;

-- Check application status distribution
SELECT status_name, COUNT(*) FROM Application 
JOIN ApplicationStatus ON Application.status_id = ApplicationStatus.status_id 
GROUP BY status_name;
```

---

## 🔧 Setup Instructions

### Prerequisites
- MySQL 8.0+ (for window functions and CTE support)
- InnoDB storage engine (for transaction support)

### Installation

1. **Create Database**:
```bash
mysql -u root -p < internship_tracker.sql
```

2. **Verify Installation**:
```sql
USE InternshipTracker;
SHOW TABLES;
SELECT COUNT(*) FROM Student;
```

3. **Test Authentication Setup**:
```sql
-- View users and their roles
SELECT * FROM UserAuthView;
```

---

## 📁 File Structure

```
internship_tracker.sql
├── Section 0: Database Creation
├── Section 1: Lookup Tables (10 tables)
├── Section 2: Core Tables (15 tables)
├── Section 3: Sample Data (INSERT statements)
├── Section 4: Queries (SELECT, JOINs, Subqueries)
├── Section 5: Views (4 views)
├── Section 6: Concurrency & Recovery
│   ├── Locking Procedures
│   ├── Recovery Mechanisms
│   └── Monitoring Views
├── Section 7: Authentication (JWT + RBAC)
│   ├── Role/Permission Tables
│   ├── User Management
│   └── Login Tracking
└── Section 8: Stored Procedures & Triggers
```

---

## 🔄 Backup & Recovery

### Regular Backup
```sql
-- Export database
mysqldump -u root -p InternshipTracker > backup.sql

-- Compressed backup
mysqldump -u root -p InternshipTracker | gzip > backup.sql.gz
```

### Point-in-Time Recovery
```sql
-- Recover application to previous state
CALL RecoverApplicationState(1, '2024-01-15 10:00:00');
```

---

## 📝 Notes for Developers

### Adding New Skills
```sql
INSERT INTO Skill (skill_name, category) VALUES ('Rust', 'Programming');
```

### Creating New Opportunity
```sql
-- First create the opportunity
INSERT INTO InternshipOpportunity (...) VALUES (...);

-- Then add eligibility criteria
INSERT INTO EligibilityCriteria (...) VALUES (...);

-- Then add required skills
INSERT INTO Opportunity_Skill (...) VALUES (...);
```

### Extending Permissions
```sql
-- Add new permission
INSERT INTO Permission (permission_name) VALUES ('NEW_PERMISSION');

-- Assign to role
INSERT INTO Role_Permission (role_id, permission_id) VALUES (1, LAST_INSERT_ID());
```

---

## ⚡ Performance Considerations

### Indexes Created
- `idx_student_name` - Name searches
- `idx_opportunity_active` - Active opportunity queries
- `idx_application_status_date` - Status + date filtering
- `idx_interview_status` - Interview status queries
- `idx_user_email` - Fast authentication lookups

### Optimization Tips
- Use `ActiveOpportunities` view instead of raw joins
- Batch operations recommended for bulk updates
- Monitor `LockWaitMonitor` for contention issues
- Regularly archive old `ApplicationStatusHistory` records

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Deadlock errors | Retry operation or use `SafeUpdateApplicationStatus` |
| Permission denied | Check user role and permissions via `UserAuthView` |
| Duplicate application | Unique constraint prevents; check existing applications |
| Eligibility check fails | Verify CGPA and department against `EligibilityCriteria` |

### Debug Queries
```sql
-- Check active locks
SELECT * FROM performance_schema.data_locks;

-- View recent transactions
SELECT * FROM information_schema.innodb_trx;

-- Check application status history
SELECT * FROM ApplicationStatusHistory WHERE application_id = 1 ORDER BY changed_at;
```

---

## 📚 Dependencies

- MySQL 8.0+
- InnoDB Engine
- `performance_schema` enabled (for lock monitoring)

---

## 👥 Contributors

This database schema was designed as a comprehensive solution for internship and placement tracking with normalization, concurrency control, and security best practices.

---

## 📄 License

This SQL script is provided for educational and implementation purposes.

---
