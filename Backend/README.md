# Internship Management System - Backend API

A comprehensive backend system for managing internships, students, companies, applications, and interviews. Built with **FastAPI**, **SQLAlchemy**, and **JWT authentication**.

---

## 🚀 Tech Stack

- **FastAPI** – Modern web framework
- **SQLAlchemy** – ORM for database interactions
- **PostgreSQL / SQLite** – Database (configurable)
- **JWT** – Authentication
- **Python-dotenv** – Environment variable management
- **Passlib** – Password hashing

---

## 📁 Project Structure

```
Backend/
├── auth/               # Authentication module
│   ├── auth_routes.py  # Auth endpoints
│   ├── auth.py         # JWT logic
│   ├── dependencies.py # Auth dependencies
│   ├── hashing.py      # Password hashing
│   └── schemas.py      # Auth schemas
├── __pycache__/        # Compiled Python files
├── .env                # Environment variables
├── .env_sample         # Sample environment variables
├── .gitignore
├── database.py         # Database connection setup
├── main.py             # FastAPI app entry point
├── models.py           # SQLAlchemy models
├── README.md
├── requirements.txt    # Dependencies
├── routes.py           # All CRUD endpoints
├── schemas.py          # Pydantic schemas
└── services.py         # Business logic layer
```

---

## 🔐 API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Authentication (`/auth`)

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| POST   | `/auth/register`   | Register new user            |
| POST   | `/auth/login`      | Login & get JWT token        |
| GET    | `/auth/me`         | Get current logged-in user   |

---

### Departments (`/departments`)

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| POST   | `/departments/`    | Create department            |
| GET    | `/departments/`    | Get all departments          |
| GET    | `/departments/{id}`| Get single department        |
| PUT    | `/departments/{id}`| Update department            |
| DELETE | `/departments/{id}`| Delete department            |

---

### Students (`/students`)

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| POST   | `/students/`                 | Create student                       |
| GET    | `/students/`                 | Get all students (filter by dept_id) |
| GET    | `/students/{id}`             | Get single student                   |
| PUT    | `/students/{id}`             | Update student                       |
| DELETE | `/students/{id}`             | Delete student                       |
| POST   | `/students/{id}/skills/`     | Add skill to student                 |
| GET    | `/students/{id}/skills/`     | Get student skills                   |

---

### Companies (`/companies`)

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| POST   | `/companies/`      | Create company                 |
| GET    | `/companies/`      | Get all companies (active flag)|
| GET    | `/companies/{id}`  | Get single company             |
| PUT    | `/companies/{id}`  | Update company                 |
| DELETE | `/companies/{id}`  | Delete company                 |

---

### Skills (`/skills`)

| Method | Endpoint           | Description                |
|--------|--------------------|----------------------------|
| POST   | `/skills/`         | Create skill               |
| GET    | `/skills/`         | Get all skills (by category)|
| GET    | `/skills/{id}`     | Get single skill           |
| PUT    | `/skills/{id}`     | Update skill               |
| DELETE | `/skills/{id}`     | Delete skill               |

---

### Internship Opportunities (`/opportunities`)

| Method | Endpoint               | Description                      |
|--------|------------------------|----------------------------------|
| POST   | `/opportunities/`      | Create opportunity               |
| GET    | `/opportunities/`      | Get opportunities (active filter)|
| GET    | `/opportunities/{id}`  | Get single opportunity           |
| PUT    | `/opportunities/{id}`  | Update opportunity               |
| DELETE | `/opportunities/{id}`  | Delete opportunity               |

---

### Applications (`/applications`)

| Method | Endpoint                     | Description                  |
|--------|------------------------------|------------------------------|
| POST   | `/applications/`             | Apply for internship         |
| GET    | `/applications/`             | Get applications (by student)|
| GET    | `/applications/{id}`         | Get single application       |
| PUT    | `/applications/{id}/status`  | Update application status    |
| DELETE | `/applications/{id}`         | Delete application           |
| GET    | `/applications/{id}/history` | Get application history      |

---

### Eligibility

| Method | Endpoint                 | Description                          |
|--------|--------------------------|--------------------------------------|
| POST   | `/check-eligibility/`    | Check if student is eligible for opp |

---

### Interviews (`/interviews`)

| Method | Endpoint                               | Description                     |
|--------|----------------------------------------|---------------------------------|
| POST   | `/interviews/`                         | Create interview                |
| GET    | `/interviews/{id}`                     | Get interview details           |
| GET    | `/applications/{id}/interviews/`       | Get interviews for application  |
| PUT    | `/interviews/{id}`                     | Update interview                |
| DELETE | `/interviews/{id}`                     | Delete interview                |

---

## 🧠 Architecture & Request Flow

```
Client Request
      ↓
FastAPI Routes (routes.py)
      ↓
Service Layer (services.py) ← Business Logic
      ↓
Database Layer (models.py + SQLAlchemy)
      ↓
Database (PostgreSQL/SQLite)
```

### 🔹 Authentication Flow

1. **Register** – User provides email, password, role → Password hashed → Stored in DB
2. **Login** – Verify credentials → Generate JWT token
3. **Protected Routes** – Token passed in headers → Validated → Extracts `user_id` and `role`

### 🔹 Example: Student Applying for Internship

1. Student logs in → Receives JWT token
2. Sends `POST /applications/` with token
3. Backend validates token → Checks student & opportunity existence
4. Creates application record in DB
5. Returns success response

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/internship-backend.git
cd internship-backend/Backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Variables

Copy `.env_sample` to `.env` and fill in your values:

```env
DATABASE_URL=postgresql://user:pass@localhost/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Run the Server

```bash
uvicorn main:app --reload
```

API will be available at: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

---

## 🧪 Testing with Postman / cURL

### Register a Student

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"secret","role":"student"}'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"secret"}'
```

### Access Protected Route

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <your-token>"
```

---

## 🔧 Key Features

- ✅ Modular architecture (routes, services, models)
- ✅ JWT authentication with role-based access
- ✅ CRUD operations for all entities
- ✅ Relationship handling (Student ↔ Skills, Applications ↔ Interviews)
- ✅ Query parameter filtering
- ✅ Eligibility checking
- ✅ Error handling & validation

---

## 📄 License

MIT

---

## 👨‍💻 Author

Your Name – [your.email@example.com](mailto\:your.email@example.com)

---

## 🙌 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

```

---