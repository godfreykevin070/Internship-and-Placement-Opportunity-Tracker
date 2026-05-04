// pages/CompanyDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

// Type definitions matching your API schemas
interface Company {
  company_id: number;
  company_name: string;
  industry: string;
  website: string;
  hr_contact_name: string;
  hr_contact_email: string;
  hr_contact_phone: string;
  company_size: string;
  founded_year: number;
  is_active: boolean;
  created_at: string;
}

interface CompanyCreate {
  company_name: string;
  industry?: string;
  website?: string;
  hr_contact_name: string;
  hr_contact_email: string;
  hr_contact_phone?: string;
  company_size?: string;
  founded_year?: number;
}

interface Opportunity {
  opportunity_id: number;
  title: string;
  description: string;
  company_id: number;
  company_name?: string;
  internship_type: string;
  duration_weeks: number;
  stipend_amount: number;
  location: string;
  remote_option: boolean;
  application_deadline: string;
  is_active: boolean;
  max_applications?: number;
  required_skills?: string[];
  application_count?: number;
  min_cgpa?: number;
  required_department?: string;
}

interface StudentInfo {
  student_id: number;
  enrollment_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_cgpa: number;
  department: {
    department_id: number;
    department_name: string;
    department_code: string;
  };
  academic_year: number;
}

interface Application {
  application_id: number;
  student_id: number;
  opportunity_id: number;
  status: string;
  selection_round: string;
  application_date: string;
  cover_letter?: string;
  remarks?: string;
  student_info?: StudentInfo;
  opportunity_title?: string;
}

interface Interview {
  interview_id: number;
  application_id: number;
  interview_date: string;
  interview_type: string;
  interviewer_name?: string;
  interview_platform?: string;
  duration_minutes: number;
  feedback?: string;
  score?: number;
  status: string;
}

interface DashboardStats {
  activeJobs: number;
  totalJobs: number;
  totalApplicants: number;
  shortlistedCount: number;
  selectedCount: number;
  rejectedCount: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
}

const CompanyDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [company, setCompany] = useState<Company | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackScore, setFeedbackScore] = useState(0);
  
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalJobs: 0,
    totalApplicants: 0,
    shortlistedCount: 0,
    selectedCount: 0,
    rejectedCount: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0
  });

  // Company creation form state
  const [companyForm, setCompanyForm] = useState<CompanyCreate>({
    company_name: '',
    industry: '',
    website: '',
    hr_contact_name: '',
    hr_contact_email: user?.email || '',
    hr_contact_phone: '',
    company_size: '',
    founded_year: new Date().getFullYear()
  });

  // New opportunity form state
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    internship_type: 'Full-time',
    duration_weeks: 12,
    stipend_amount: 0,
    location: '',
    remote_option: false,
    application_deadline: '',
    min_cgpa: 7.0,
    required_department_id: undefined as number | undefined,
    required_skills: '',
    max_applications: 100
  });

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Step 1: Create company profile
  const createCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/companies/`, companyForm, axiosConfig);
      setCompany(response.data);
      setShowCompanyForm(false);
      alert('Company profile created successfully!');
      await fetchAllData();
    } catch (error: any) {
      console.error('Error creating company:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to create company profile';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company data
  const fetchCompanyData = useCallback(async () => {
    try {
      // First, try to get the company associated with the logged-in user
      const response = await axios.get(`${API_BASE_URL}/companies/`, axiosConfig);
      const companies = response.data;
      
      // If user is company admin, they should have exactly one company
      // You might need to modify your backend to have a /companies/me endpoint
      if (companies && companies.length > 0) {
        // Assuming the first company belongs to this user
        // Better: add company_id to JWT token or create /companies/me endpoint
        setCompany(companies[0]);
        return companies[0];
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching company:', err);
      if (err.response?.status === 404 || err.response?.status === 401) {
        return null;
      }
      throw err;
    }
  }, [token]);

  // Fetch opportunities for the company
  const fetchOpportunities = useCallback(async (companyId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/opportunities/`, {
        ...axiosConfig,
        params: { company_id: companyId }
      });
      setOpportunities(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      return [];
    }
  }, [token]);

  // Fetch applications for company's opportunities
  const fetchApplications = useCallback(async (opportunitiesList: Opportunity[]) => {
    if (!opportunitiesList.length) {
      setApplications([]);
      return [];
    }

    try {
      const allApplications = await Promise.all(
        opportunitiesList.map(async (opp) => {
          try {
            const response = await axios.get(`${API_BASE_URL}/applications/`, {
              ...axiosConfig,
              params: { opportunity_id: opp.opportunity_id }
            });
            return response.data.map((app: Application) => ({
              ...app,
              opportunity_title: opp.title
            }));
          } catch (err) {
            return [];
          }
        })
      );

      const flattened = allApplications.flat();
      
      // Fetch student details for each application
      const appsWithStudentInfo = await Promise.all(
        flattened.map(async (app) => {
          try {
            const studentRes = await axios.get(`${API_BASE_URL}/students/${app.student_id}`, axiosConfig);
            return { ...app, student_info: studentRes.data };
          } catch (err) {
            return app;
          }
        })
      );
      
      setApplications(appsWithStudentInfo);
      return appsWithStudentInfo;
    } catch (err) {
      console.error('Error fetching applications:', err);
      return [];
    }
  }, [token]);

  // Fetch interviews for applications
  const fetchInterviews = useCallback(async (applicationsList: Application[]) => {
    if (!applicationsList.length) {
      setInterviews([]);
      return [];
    }

    try {
      const allInterviews = await Promise.all(
        applicationsList.map(async (app) => {
          try {
            const response = await axios.get(`${API_BASE_URL}/applications/${app.application_id}/interviews/`, axiosConfig);
            return response.data;
          } catch (err) {
            return [];
          }
        })
      );
      
      const flattened = allInterviews.flat();
      setInterviews(flattened);
      return flattened;
    } catch (err) {
      console.error('Error fetching interviews:', err);
      return [];
    }
  }, [token]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const companyData = await fetchCompanyData();
      
      if (!companyData) {
        // No company profile exists, show creation form
        setShowCompanyForm(true);
        setLoading(false);
        return;
      }
      
      const opportunitiesData = await fetchOpportunities(companyData.company_id);
      const applicationsData = await fetchApplications(opportunitiesData);
      const interviewsData = await fetchInterviews(applicationsData);
      
      // Calculate statistics
      const activeJobs = opportunitiesData.length;
      const shortlistedCount = applicationsData.filter(a => a.status === 'Shortlisted').length;
      const selectedCount = applicationsData.filter(a => a.status === 'Selected').length;
      const rejectedCount = applicationsData.filter(a => a.status === 'Rejected').length;
      const interviewsScheduled = interviewsData.filter(i => i.status === 'Scheduled').length;
      const interviewsCompleted = interviewsData.filter(i => i.status === 'Completed').length;
      
      setStats({
        activeJobs,
        totalJobs: opportunitiesData.length,
        totalApplicants: applicationsData.length,
        shortlistedCount,
        selectedCount,
        rejectedCount,
        interviewsScheduled,
        interviewsCompleted
      });
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCompanyData, fetchOpportunities, fetchApplications, fetchInterviews, logout, navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setLoading(true);
    try {
      const opportunityData = {
        ...newOpportunity,
        company_id: company.company_id,
        required_skills: newOpportunity.required_skills ? newOpportunity.required_skills.split(',').map(s => s.trim()) : [],
        is_active: true
      };
      
      await axios.post(`${API_BASE_URL}/opportunities/`, opportunityData, axiosConfig);
      alert('Opportunity created successfully!');
      setShowOpportunityModal(false);
      setNewOpportunity({
        title: '',
        description: '',
        internship_type: 'Full-time',
        duration_weeks: 12,
        stipend_amount: 0,
        location: '',
        remote_option: false,
        application_deadline: '',
        min_cgpa: 7.0,
        required_department_id: undefined,
        required_skills: '',
        max_applications: 100
      });
      await fetchAllData();
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      alert(error.response?.data?.detail || 'Failed to create opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      await axios.put(`${API_BASE_URL}/applications/${applicationId}/status`, 
        { status },
        axiosConfig
      );
      alert(`Application ${status.toLowerCase()} successfully`);
      await fetchAllData();
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error.response?.data?.detail || 'Failed to update application status');
    }
  };

  const handleScheduleInterview = async (applicationId: number) => {
    const date = prompt('Enter interview date and time (YYYY-MM-DD HH:MM:SS):');
    if (!date) return;
    
    const type = prompt('Interview type (Technical/HR/Behavioral):', 'Technical');
    const platform = prompt('Interview platform (Zoom/Google Meet/In-person):', 'Zoom');
    const duration = prompt('Duration in minutes:', '60');
    
    try {
      await axios.post(`${API_BASE_URL}/interviews/`, {
        application_id: applicationId,
        interview_date: date,
        interview_type: type || 'Technical',
        interview_platform: platform || 'Zoom',
        duration_minutes: parseInt(duration || '60'),
        status: 'Scheduled'
      }, axiosConfig);
      alert('Interview scheduled successfully');
      await fetchAllData();
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      alert(error.response?.data?.detail || 'Failed to schedule interview');
    }
  };

  const handleAddFeedback = async (interviewId: number) => {
    if (!feedbackText.trim()) {
      alert('Please enter feedback');
      return;
    }
    
    try {
      await axios.put(`${API_BASE_URL}/interviews/${interviewId}`, {
        feedback: feedbackText,
        score: feedbackScore,
        status: 'Completed'
      }, axiosConfig);
      alert('Feedback added successfully');
      setShowFeedbackModal(false);
      setFeedbackText('');
      setFeedbackScore(0);
      await fetchAllData();
    } catch (error: any) {
      console.error('Error adding feedback:', error);
      alert(error.response?.data?.detail || 'Failed to add feedback');
    }
  };

  const toggleOpportunityStatus = async (opportunityId: number, currentStatus: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/opportunities/${opportunityId}`, {
        is_active: !currentStatus
      }, axiosConfig);
      await fetchAllData();
      alert(`Opportunity ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling opportunity:', error);
      alert(error.response?.data?.detail || 'Failed to update opportunity');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Submitted': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-blue-100 text-blue-800',
      'Shortlisted': 'bg-purple-100 text-purple-800',
      'Selected': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Offer Accepted': 'bg-emerald-100 text-emerald-800',
      'Offer Declined': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getInterviewStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Scheduled': 'bg-green-100 text-green-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Rescheduled': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Company Creation Form Component
  const CompanyCreationForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Company Profile</h2>
        <p className="text-gray-600 mb-6">Please fill in your company details to get started.</p>
        
        <form onSubmit={createCompanyProfile}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyForm.company_name}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Name *</label>
              <input
                type="text"
                required
                value={companyForm.hr_contact_name}
                onChange={(e) => setCompanyForm({ ...companyForm, hr_contact_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name of HR contact person"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Email *</label>
              <input
                type="email"
                required
                value={companyForm.hr_contact_email}
                onChange={(e) => setCompanyForm({ ...companyForm, hr_contact_email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hr@company.com"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select
                  value={companyForm.company_size}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_size: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Phone</label>
                <input
                  type="tel"
                  value={companyForm.hr_contact_phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, hr_contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
              <input
                type="number"
                value={companyForm.founded_year}
                onChange={(e) => setCompanyForm({ ...companyForm, founded_year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Create Company Profile'}
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Loading State
  if (loading && !showCompanyForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show Company Creation Form if no company exists
  if (showCompanyForm) {
    return <CompanyCreationForm />;
  }

  // Error State
  if (error && !showCompanyForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main Dashboard Render
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">Company Dashboard</h1>
              <div className="hidden md:flex space-x-4">
                {['overview', 'opportunities', 'applications', 'interviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {company?.company_name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner for New Companies with no opportunities */}
        {company && opportunities.length === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Welcome to your Dashboard, {company.company_name}! 🎉
                </h3>
                <p className="text-gray-600 mb-3">
                  Your company profile is all set. Now post your first internship opportunity to start receiving applications from students.
                </p>
                <button
                  onClick={() => setShowOpportunityModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Post Your First Opportunity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.activeJobs}</p>
                    <p className="text-xs text-gray-500">Total: {stats.totalJobs}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Applicants</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalApplicants}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Shortlisted</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.shortlistedCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Interviews</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.interviewsScheduled}</p>
                    <p className="text-xs text-gray-500">Completed: {stats.interviewsCompleted}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowOpportunityModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Post New Opportunity</span>
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  View All Applicants
                </button>
                <button
                  onClick={() => setActiveTab('interviews')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Manage Interviews
                </button>
              </div>
            </div>

            {/* Recent Applications */}
            {applications.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Applications</h2>
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.application_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {app.student_info?.first_name} {app.student_info?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{app.opportunity_title}</p>
                        <p className="text-xs text-gray-500">
                          Applied: {new Date(app.application_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">My Opportunities</h2>
              <button
                onClick={() => setShowOpportunityModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Post New Opportunity
              </button>
            </div>
            
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💼</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Yet</h3>
                <p className="text-gray-500">Click the button above to post your first internship opportunity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.opportunity_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-800 text-lg">{opp.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${opp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {opp.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{opp.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            📍 {opp.location || 'Remote'}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            💰 ₹{opp.stipend_amount.toLocaleString()}/month
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            📅 {opp.duration_weeks} weeks
                          </span>
                          {opp.min_cgpa && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              🎓 Min CGPA: {opp.min_cgpa}
                            </span>
                          )}
                        </div>
                        {opp.required_skills && opp.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {opp.required_skills.map((skill, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          Deadline: {new Date(opp.application_deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => toggleOpportunityStatus(opp.opportunity_id, opp.is_active)}
                          className={`text-sm px-3 py-1 rounded-lg ${
                            opp.is_active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {opp.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Student Applications</h2>
            
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-500">Students will appear here when they apply to your opportunities.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied For</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.application_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">
                              {app.student_info?.first_name} {app.student_info?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{app.student_info?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.student_info?.department?.department_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (app.student_info?.current_cgpa || 0) >= 8 ? 'bg-green-100 text-green-800' :
                            (app.student_info?.current_cgpa || 0) >= 7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {app.student_info?.current_cgpa || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.opportunity_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-2">
                            {app.status === 'Submitted' && (
                              <button
                                onClick={() => handleUpdateApplicationStatus(app.application_id, 'Under Review')}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                Start Review
                              </button>
                            )}
                            {app.status === 'Under Review' && (
                              <button
                                onClick={() => handleUpdateApplicationStatus(app.application_id, 'Shortlisted')}
                                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                              >
                                Shortlist
                              </button>
                            )}
                            {app.status === 'Shortlisted' && (
                              <button
                                onClick={() => handleScheduleInterview(app.application_id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              >
                                Schedule Interview
                              </button>
                            )}
                            {!['Rejected', 'Selected'].includes(app.status) && (
                              <button
                                onClick={() => handleUpdateApplicationStatus(app.application_id, 'Rejected')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Interview Schedule</h2>
            
            {interviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Scheduled</h3>
                <p className="text-gray-500">Shortlist candidates to schedule interviews.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div key={interview.interview_id} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {applications.find(a => a.application_id === interview.application_id)?.student_info?.first_name} {' '}
                          {applications.find(a => a.application_id === interview.application_id)?.student_info?.last_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {new Date(interview.interview_date).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          🎥 {interview.interview_type} • {interview.duration_minutes} minutes
                        </p>
                        {interview.interview_platform && (
                          <p className="text-sm text-gray-600">📍 {interview.interview_platform}</p>
                        )}
                        {interview.feedback && (
                          <div className="mt-2 p-2 bg-white rounded">
                            <p className="text-sm font-medium text-gray-700">Feedback:</p>
                            <p className="text-sm text-gray-600">{interview.feedback}</p>
                            {interview.score && <p className="text-sm text-gray-600 mt-1">Score: {interview.score}/100</p>}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getInterviewStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                        {interview.status === 'Scheduled' && (
                          <button
                            onClick={() => {
                              setSelectedApplication(applications.find(a => a.application_id === interview.application_id) || null);
                              setShowFeedbackModal(true);
                            }}
                            className="ml-3 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Add Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Opportunity Modal */}
      {showOpportunityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Post New Opportunity</h2>
            <form onSubmit={handleCreateOpportunity}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newOpportunity.title}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Software Development Intern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={newOpportunity.description}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the role, responsibilities, and requirements..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stipend (₹/month)</label>
                    <input
                      type="number"
                      value={newOpportunity.stipend_amount}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, stipend_amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                    <input
                      type="number"
                      value={newOpportunity.duration_weeks}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, duration_weeks: parseInt(e.target.value) || 12 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={newOpportunity.location}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bangalore"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newOpportunity.min_cgpa}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, min_cgpa: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                  <input
                    type="text"
                    value={newOpportunity.required_skills}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, required_skills: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="React, Python, Node.js (comma-separated)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={newOpportunity.application_deadline}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, application_deadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newOpportunity.remote_option}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, remote_option: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Remote Opportunity</span>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                  Create Opportunity
                </button>
                <button type="button" onClick={() => setShowOpportunityModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add Interview Feedback</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback *</label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed feedback about the candidate..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feedbackScore}
                  onChange={(e) => setFeedbackScore(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => {
                  const interview = interviews.find(i => i.application_id === selectedApplication.application_id);
                  if (interview) handleAddFeedback(interview.interview_id);
                }} 
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Submit Feedback
              </button>
              <button 
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setFeedbackScore(0);
                }} 
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;