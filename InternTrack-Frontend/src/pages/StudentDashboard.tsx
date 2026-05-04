// pages/StudentDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

// Type definitions matching your database schema
interface Student {
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
  resume_link: string;
  profile_completion?: number;
}

interface Skill {
  skill_id: number;
  skill_name: string;
  category: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

interface Opportunity {
  opportunity_id: number;
  title: string;
  description: string;
  company_id: number;
  company_name: string;
  internship_type: string;
  duration_weeks: number;
  stipend_amount: number;
  location: string;
  remote_option: boolean;
  application_deadline: string;
  is_active: boolean;
  min_cgpa?: number;
  required_department?: string;
  required_skills?: string[];
  is_eligible?: boolean;
}

interface Application {
  application_id: number;
  student_id: number;
  opportunity_id: number;
  opportunity_title: string;
  company_name: string;
  status: string;
  selection_round: string;
  application_date: string;
  cover_letter?: string;
}

interface Interview {
  interview_id: number;
  application_id: number;
  interview_date: string;
  interview_type: string;
  interviewer_name: string;
  interview_platform: string;
  duration_minutes: number;
  feedback: string;
  score: number;
  status: string;
}

const StudentDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<Student | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedOpps, setRecommendedOpps] = useState<Opportunity[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchStudentData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/me`, axiosConfig);
      setStudent(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching student data:', err);
      return null;
    }
  }, [token]);

  const fetchStudentSkills = useCallback(async (studentId: number) => {
    try {
      const response = await axios.get<Skill[]>(`${API_BASE_URL}/students/${studentId}/skills/`, axiosConfig);
      // Deduplicate skills by skill_id
      const uniqueSkills = Array.from(
        new Map(response.data.map((s: Skill) => [s.skill_id, s])).values()
      );
      setSkills(uniqueSkills);
      return uniqueSkills;
    } catch (err) {
      console.error('Error fetching skills:', err);
      return [];
    }
  }, [token]);

  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await axios.get<Opportunity[]>(`${API_BASE_URL}/opportunities/?is_active=true`, axiosConfig);
      const uniqueOpps = Array.from(
        new Map(response.data.map((o: Opportunity) => [o.opportunity_id, o])).values()
      );
      setOpportunities(uniqueOpps);
      return uniqueOpps;
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      return [];
    }
  }, [token]);

  const fetchApplications = useCallback(async (studentId: number) => {
    try {
      const response = await axios.get<Application[]>(`${API_BASE_URL}/applications/?student_id=${studentId}`, axiosConfig);
      const uniqueApps = Array.from(
        new Map(response.data.map((a: Application) => [a.application_id, a])).values()
      );
      setApplications(uniqueApps);
      return uniqueApps;
    } catch (err) {
      console.error('Error fetching applications:', err);
      return [];
    }
  }, [token]);

  const fetchInterviews = useCallback(async (applicationsList: Application[]) => {
    try {
      const interviewsData = await Promise.all(
        applicationsList.map(async (app) => {
          const response = await axios.get(`${API_BASE_URL}/applications/${app.application_id}/interviews/`, axiosConfig);
          return response.data;
        })
      );
      const allInterviews = interviewsData.flat();
      const uniqueInterviews = Array.from(
        new Map(allInterviews.map((i: Interview) => [i.interview_id, i])).values()
      );
      setInterviews(uniqueInterviews);
      return uniqueInterviews;
    } catch (err) {
      console.error('Error fetching interviews:', err);
      return [];
    }
  }, [token]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const studentData = await fetchStudentData();
      if (!studentData) {
        setError('Failed to load student data');
        return;
      }
      
      const [skillsData, opportunitiesData, applicationsData] = await Promise.all([
        fetchStudentSkills(studentData.student_id),
        fetchOpportunities(),
        fetchApplications(studentData.student_id)
      ]);
      
      await fetchInterviews(applicationsData);
      
      // Calculate eligibility for each opportunity
      const opportunitiesWithEligibility = opportunitiesData.map(opp => {
        const applied = applicationsData.some(app => app.opportunity_id === opp.opportunity_id);
        let isEligible = !applied && opp.is_active && new Date(opp.application_deadline) > new Date();
        
        // Check CGPA eligibility
        if (isEligible && opp.min_cgpa && studentData.current_cgpa < opp.min_cgpa) {
          isEligible = false;
        }
        
        // Check department eligibility
        if (isEligible && opp.required_department && 
            studentData.department?.department_name !== opp.required_department) {
          isEligible = false;
        }
        
        // Check skill requirements
        if (isEligible && opp.required_skills && opp.required_skills.length > 0) {
          const studentSkillNames = skillsData.map(s => s.skill_name.toLowerCase());
          const hasRequiredSkills = opp.required_skills.some(skill => 
            studentSkillNames.includes(skill.toLowerCase())
          );
          if (!hasRequiredSkills) isEligible = false;
        }
        
        return { ...opp, is_eligible: isEligible };
      });
      
      const eligibleOpps = opportunitiesWithEligibility.filter(o => o.is_eligible);
      setRecommendedOpps(eligibleOpps.slice(0, 5));
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchStudentData, fetchStudentSkills, fetchOpportunities, fetchApplications, fetchInterviews]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApply = async (opportunityId: number) => {
    try {
      await axios.post(`${API_BASE_URL}/applications/`, {
        student_id: student?.student_id,
        opportunity_id: opportunityId
      }, axiosConfig);
      alert('Application submitted successfully!');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error applying:', error);
      alert(error.response?.data?.message || 'Failed to submit application');
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      alert('Please enter a skill name');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/students/${student?.student_id}/skills/`, {
        skill_name: newSkill,
        proficiency_level_id: 2 // Intermediate by default
      }, axiosConfig);
      setNewSkill('');
      fetchDashboardData();
      alert('Skill added successfully!');
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    }
  };

  const handleResumeUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    
    setUploading(true);
    try {
      await axios.post(`${API_BASE_URL}/students/${student?.student_id}/resume/`, formData, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Resume uploaded successfully!');
      setSelectedFile(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setUploading(false);
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

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    let completed = 0;
    let total = 5; // Total fields to check
    
    if (student?.first_name && student?.last_name) completed++;
    if (student?.phone) completed++;
    if (student?.resume_link) completed++;
    if (skills.length > 0) completed++;
    if (student?.current_cgpa) completed++;
    
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Student Dashboard
              </h1>
              <div className="hidden md:flex space-x-4">
                {['overview', 'opportunities', 'applications', 'interviews', 'profile', 'analytics'].map((tab) => (
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
                    {tab === 'opportunities' && opportunities.length > 0 && (
                      <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                        {opportunities.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                Welcome, {student?.first_name} {student?.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Profile Completion</p>
                    <p className="text-2xl font-bold text-gray-800">{profileCompletion}%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 rounded-full h-2 transition-all" style={{ width: `${profileCompletion}%` }}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Eligible Opportunities</p>
                    <p className="text-2xl font-bold text-gray-800">{recommendedOpps.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Applications</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {applications.filter(a => !['Rejected', 'Offer Declined'].includes(a.status)).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Interviews</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {interviews.filter(i => new Date(i.interview_date) > new Date() && i.status === 'Scheduled').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Opportunities */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recommended for You 🔥
              </h2>
              {recommendedOpps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <p className="text-gray-500">No recommended opportunities available at the moment.</p>
                  <p className="text-sm text-gray-400 mt-2">Update your profile and skills to get personalized recommendations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedOpps.map((opp) => (
                    <div key={opp.opportunity_id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800">{opp.title}</h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          ₹{opp.stipend_amount?.toLocaleString() || '0'}/month
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{opp.company_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{opp.location} {opp.remote_option && '• Remote'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {opp.required_skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {opp.required_skills && opp.required_skills.length > 3 && (
                          <span className="text-xs text-gray-500">+{opp.required_skills.length - 3} more</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Deadline: {new Date(opp.application_deadline).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleApply(opp.opportunity_id)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Applications</h2>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <p className="text-gray-500">You haven't applied to any opportunities yet.</p>
                  <button
                    onClick={() => setActiveTab('opportunities')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Opportunities →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.application_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-800">{app.opportunity_title}</p>
                        <p className="text-sm text-gray-600">{app.company_name}</p>
                        <p className="text-xs text-gray-500 mt-1">Round: {app.selection_round}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(app.application_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Explore Internships</h2>
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💼</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Available</h3>
                <p className="text-gray-500">There are no active internship opportunities at the moment.</p>
                <p className="text-sm text-gray-400 mt-2">Check back later for new opportunities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opp) => {
                  const hasApplied = applications.some(app => app.opportunity_id === opp.opportunity_id);
                  const isDeadlinePassed = new Date(opp.application_deadline) < new Date();
                  
                  return (
                    <div key={opp.opportunity_id} className="border rounded-lg p-5 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 text-lg">{opp.title}</h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {opp.internship_type || 'Internship'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{opp.company_name}</p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{opp.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <span>📍 {opp.location}</span>
                        {opp.remote_option && <span>🌐 Remote</span>}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-green-600">
                        ₹{opp.stipend_amount?.toLocaleString() || '0'} / month
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {opp.required_skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {opp.required_skills && opp.required_skills.length > 3 && (
                          <span className="text-xs text-gray-500">+{opp.required_skills.length - 3}</span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          📅 Deadline: {new Date(opp.application_deadline).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleApply(opp.opportunity_id)}
                          disabled={hasApplied || isDeadlinePassed}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            hasApplied || isDeadlinePassed
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {hasApplied ? 'Applied' : isDeadlinePassed ? 'Closed' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">My Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-500">You haven't applied to any internships.</p>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Opportunities
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Round</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.application_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.opportunity_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(app.application_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.selection_round}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">Interviews</h2>
            {interviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Scheduled</h3>
                <p className="text-gray-500">You don't have any upcoming or past interviews.</p>
                <p className="text-sm text-gray-400 mt-2">Interviews will appear here once your applications are shortlisted.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div key={interview.interview_id} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Interview with {interview.interviewer_name || 'Recruiter'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {new Date(interview.interview_date).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          🎥 {interview.interview_type} • {interview.duration_minutes} minutes
                        </p>
                        {interview.interview_platform && (
                          <p className="text-sm text-gray-600">📍 Platform: {interview.interview_platform}</p>
                        )}
                        {interview.feedback && (
                          <div className="mt-2 p-2 bg-white rounded">
                            <p className="text-sm font-medium text-gray-700">Feedback:</p>
                            <p className="text-sm text-gray-600">{interview.feedback}</p>
                            {interview.score && (
                              <p className="text-sm text-gray-600 mt-1">Score: {interview.score}/100</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getInterviewStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Management</h2>
            <div className="space-y-6">
              {/* Profile Completion Bar */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-800">Profile Completion</span>
                  <span className="text-sm font-bold text-blue-800">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 rounded-full h-2 transition-all" style={{ width: `${profileCompletion}%` }}></div>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input 
                      type="text" 
                      defaultValue={student?.first_name || ''} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue={student?.last_name || ''} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input 
                      type="email" 
                      value={student?.email || ''} 
                      disabled 
                      className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input 
                      type="tel" 
                      defaultValue={student?.phone || ''} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enrollment Number</label>
                    <input 
                      type="text" 
                      value={student?.enrollment_number || ''} 
                      disabled 
                      className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input 
                      type="text" 
                      value={student?.department?.department_name || 'Not Assigned'} 
                      disabled 
                      className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CGPA</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      defaultValue={student?.current_cgpa || ''} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                    <input 
                      type="number" 
                      defaultValue={student?.academic_year || ''} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Skills Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill) => (
                      <span key={skill.skill_id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {skill.skill_name}
                        {skill.proficiency_level && (
                          <span className="text-xs text-blue-600">({skill.proficiency_level})</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-3">No skills added yet.</p>
                )}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add new skill (e.g., Python, React, SQL)" 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  />
                  <button 
                    onClick={handleAddSkill}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Add Skill
                  </button>
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Resume</h3>
                {student?.resume_link ? (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">✅ Resume uploaded</p>
                    <a href={student.resume_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      View/Download Resume
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-3">No resume uploaded yet.</p>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                    id="resume-upload"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
                  </label>
                  {selectedFile && (
                    <button
                      onClick={handleResumeUpload}
                      disabled={uploading}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Resume'}
                    </button>
                  )}
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Applications Overview</h3>
                {applications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No application data available.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Applications:</span>
                      <span className="font-bold">{applications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Under Review:</span>
                      <span className="font-bold text-yellow-600">{applications.filter(a => a.status === 'Under Review').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shortlisted:</span>
                      <span className="font-bold text-purple-600">{applications.filter(a => a.status === 'Shortlisted').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected:</span>
                      <span className="font-bold text-green-600">{applications.filter(a => a.status === 'Selected').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rejected:</span>
                      <span className="font-bold text-red-600">{applications.filter(a => a.status === 'Rejected').length}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-bold">
                        {applications.length > 0 
                          ? Math.round((applications.filter(a => a.status === 'Selected').length / applications.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Skill Gap Analysis</h3>
                {skills.length === 0 ? (
                  <p className="text-gray-500 text-sm">Add skills to see analysis and recommendations.</p>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Your current skills: {skills.map(s => s.skill_name).join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      💡 Tip: Add more in-demand skills like React, Node.js, or Cloud Computing to increase your chances.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;