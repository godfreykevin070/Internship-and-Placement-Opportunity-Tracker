# Internship Management System - Frontend

A modern, feature-rich React TypeScript frontend for managing internships, student placements, company partnerships, and application tracking.

## 🚀 Features

### Core Functionality
- **Authentication System** - Secure JWT-based authentication with role-based access
- **Student Management** - View, search, filter, and manage student profiles
- **Company Management** - Manage company profiles, activate/deactivate companies
- **Opportunity Management** - Post and manage internship opportunities
- **Application Tracking** - Track student applications through various stages
- **Dashboard Analytics** - Real-time statistics and placement metrics

### Admin Features
- **Excel Bulk Import** - Import students and companies from Excel files
- **Automatic Account Creation** - Student accounts auto-generated during import
- **Application Status Management** - Update application statuses in real-time
- **Department Filters** - Filter students by department
- **Company Filters** - Filter opportunities by company
- **Comprehensive Reports** - Placement statistics and analytics

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Excel Processing**: XLSX (SheetJS)
- **Routing**: React Router DOM
- **Authentication**: JWT with Context API

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Backend API running (see backend setup)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

4. **Start the development server**
```bash
npm start
```

The application will run at `http://localhost:5432`

## 📁 Project Structure

```
src/
├── pages/
│   └── AdminDashboard.tsx    # Main admin dashboard component
|   └──StudentDashboard.tsx
|   └──CompanyDashboard.tsx
├── auth/
|   └──Login.tsx
|   └──Register.tsx
├── contexts/
│   └── AuthContext.tsx       # Authentication context provider
├── App.tsx                   # Main app component
└── index.tsx                 # Entry point
```

## 🎯 Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App

## 📊 Excel Import Format

### Students Import Template
| Column Name | Required | Description |
|------------|----------|-------------|
| Enrollment Number | Yes | Unique student identifier |
| First Name | Yes | Student's first name |
| Last Name | Yes | Student's last name |
| Email | Yes | Used for login credentials |
| Phone | No | Contact number |
| CGPA | No | Current CGPA (0-10) |
| Department ID | No | Department identifier |
| Academic Year | No | Year of admission |

**Note**: Student accounts are automatically created with generated passwords in format: `firstname_lastname@XXX`

### Companies Import Template
| Column Name | Required | Description |
|------------|----------|-------------|
| Company Name | Yes | Name of the company |
| Industry | No | Industry sector |
| Website | No | Company website URL |
| HR Contact Name | No | HR representative name |
| HR Contact Email | No | HR contact email |

## 🔐 Authentication Flow

1. **Login**: Admin uses credentials to authenticate
2. **Token Storage**: JWT token stored in context/state
3. **Protected Routes**: Dashboard accessible only with valid token
4. **Auto Logout**: Session expires on token invalidation

## 📱 Responsive Design

The dashboard is fully responsive with:
- **Desktop**: Full sidebar navigation with all features
- **Tablet**: Collapsible sidebar with adjusted layouts
- **Mobile**: Optimized tables with horizontal scrolling

## 🎨 UI Features

- **Collapsible Sidebar** - Toggle between expanded and collapsed states
- **Real-time Search** - Instant filtering across all tables
- **Status Indicators** - Color-coded badges for different states
- **Progress Indicators** - Visual feedback for import operations
- **Modal Dialogs** - Clean modals for imports and confirmations
- **Loading States** - Spinners and skeleton loaders

## 🔄 API Integration

The frontend communicates with the backend API at the configured `REACT_APP_API_URL`:

### Endpoints Used
```typescript
// Authentication
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/register

// Students
GET    /api/v1/students/
POST   /api/v1/students/
DELETE /api/v1/students/{id}

// Companies
GET    /api/v1/companies/
POST   /api/v1/companies/
PUT    /api/v1/companies/{id}
DELETE /api/v1/companies/{id}

// Opportunities
GET    /api/v1/opportunities/
POST   /api/v1/opportunities/
PUT    /api/v1/opportunities/{id}
DELETE /api/v1/opportunities/{id}

// Applications
GET    /api/v1/applications/
POST   /api/v1/applications/
PUT    /api/v1/applications/{id}/status
DELETE /api/v1/applications/{id}

// Departments & Skills
GET    /api/v1/departments/
GET    /api/v1/skills/
```

## 🚦 State Management

- **Authentication State**: Managed via React Context API
- **Data State**: Local component state with React hooks
- **Real-time Updates**: Automatic refetching after mutations
- **Loading States**: Managed per operation type

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📦 Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Verify backend is running on configured port
   - Check `REACT_APP_API_URL` in `.env` file
   - Ensure CORS is properly configured on backend

2. **Excel Import Fails**
   - Check file format matches template
   - Ensure required columns are present
   - Verify email format is valid

3. **Authentication Issues**
   - Clear browser cache and localStorage
   - Check if token is expired
   - Verify backend authentication service is running

### Development Tips

1. **Debug Mode**: Use browser DevTools for debugging
2. **API Mocking**: Consider using MSW for API mocking during development
3. **State Inspection**: React DevTools for component state inspection

## 📈 Performance Optimizations

- **Memoization**: `useCallback` and `useMemo` for expensive operations
- **Lazy Loading**: Code splitting for route-based chunks
- **Pagination**: Ready for implementing server-side pagination
- **Virtual Scrolling**: Can be added for large datasets

## 🔒 Security Considerations

- **JWT Storage**: Tokens stored in memory (context state)
- **Input Validation**: Client-side validation before API calls
- **XSS Protection**: React's built-in XSS protections
- **Secure HTTP**: Use HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Contact the development team

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Admin dashboard with CRUD operations
- ✅ Excel bulk import functionality
- ✅ Application status tracking
- ✅ Basic analytics and reports

### Phase 2 (Planned)
- ⬜ Student self-service portal
- ⬜ Company portal for posting opportunities
- ⬜ Automated email notifications
- ⬜ Advanced analytics dashboard

### Phase 3 (Future)
- ⬜ Resume parsing and AI matching
- ⬜ Interview scheduling system
- ⬜ Feedback and rating system
- ⬜ Mobile application

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│            React Frontend               │
│  ┌─────────────────────────────────┐   │
│  │      AdminDashboard.tsx         │   │
│  │  ┌──────────┐  ┌────────────┐  │   │
│  │  │ Sidebar  │  │ Main Panel │  │   │
│  │  └──────────┘  └────────────┘  │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│         Axios HTTP Client               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Backend API (FastAPI)          │
│    http://localhost:8000/api/v1         │
└─────────────────────────────────────────┘
```

## 🎯 Key Features Explained

### Excel Import with Auto-Account Creation
When importing students from Excel:
1. Validates Excel file format
2. Creates user account for each student
3. Generates secure default password
4. Creates student profile linked to user account
5. Provides detailed import report

### Application Status Flow
1. **Submitted** → Initial application
2. **Under Review** → HR screening
3. **Shortlisted** → Passed initial screening
4. **Selected** → Offered position
5. **Rejected** → Not selected

### Dashboard Statistics
- Real-time calculation of placement metrics
- Department-wise distribution
- Status-based filtering
- Placement rate tracking

## 🚀 Deployment

### Deploy to Production

1. **Build the application**
```bash
npm run build
```

2. **Serve the build folder**
```bash
# Using serve
npm install -g serve
serve -s build

# Or use nginx/Apache to serve static files
```

3. **Configure environment variables for production**
```env
REACT_APP_API_URL=https://your-api-domain.com/api/v1
```

4. **Enable HTTPS in production**
   - Use SSL certificates
   - Configure secure headers

## 📊 Monitoring & Analytics

Consider adding:
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Performance monitoring (Lighthouse CI)
- API response time tracking

---

**Note**: This frontend is designed to work with the FastAPI backend system. Ensure both services are configured correctly for full functionality.
```
