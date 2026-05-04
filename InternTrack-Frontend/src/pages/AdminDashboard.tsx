// pages/AdminDashboard.tsx
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
  application_count?: number;
}

interface Company {
  company_id: number;
  company_name: string;
  industry: string;
  website: string;
  hr_contact_name: string;
  hr_contact_email: string;
  is_active: boolean;
  created_at: string;
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
  application_count?: number;
  min_cgpa?: number;
  required_department?: string;
}

interface Application {
  application_id: number;
  student_id: number;
  student_name: string;
  student_enrollment: string;
  opportunity_id: number;
  opportunity_title: string;
  company_name: string;
  status: string;
  selection_round: string;
  application_date: string;
  cover_letter?: string;
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalCompanies: number;
  activeCompanies: number;
  totalOpportunities: number;
  activeOpportunities: number;
  totalApplications: number;
  pendingApplications: number;
  selectedApplications: number;
  placementRate: number;
}

const AdminDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for data
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    totalOpportunities: 0,
    activeOpportunities: 0,
    totalApplications: 0,
    pendingApplications: 0,
    selectedApplications: 0,
    placementRate: 0
  });
  
  // Search and filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get<Student[]>(`${API_BASE_URL}/students/`, axiosConfig);
      // Ensure no duplicates by using Map
      const uniqueStudents = Array.from(
        new Map(response.data.map((s: Student) => [s.student_id, s])).values()
      );
      setStudents(uniqueStudents);
      return uniqueStudents;
    } catch (err) {
      console.error('Error fetching students:', err);
      return [];
    }
  }, [token]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await axios.get<Company[]>(`${API_BASE_URL}/companies/`, axiosConfig);
      const uniqueCompanies = Array.from(
        new Map(response.data.map((c: Company) => [c.company_id, c])).values()
      );
      setCompanies(uniqueCompanies);
      return uniqueCompanies;
    } catch (err) {
      console.error('Error fetching companies:', err);
      return [];
    }
  }, [token]);

  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await axios.get<Opportunity[]>(`${API_BASE_URL}/opportunities/`, axiosConfig);
      const uniqueOpportunities = Array.from(
        new Map(response.data.map((o: Opportunity) => [o.opportunity_id, o])).values()
      );
      setOpportunities(uniqueOpportunities);
      return uniqueOpportunities;
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      return [];
    }
  }, [token]);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await axios.get<Application[]>(`${API_BASE_URL}/applications/`, axiosConfig);
      const uniqueApplications = Array.from(
        new Map(response.data.map((a: Application) => [a.application_id, a])).values()
      );
      setApplications(uniqueApplications);
      return uniqueApplications;
    } catch (err) {
      console.error('Error fetching applications:', err);
      return [];
    }
  }, [token]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [studentsData, companiesData, opportunitiesData, applicationsData] = await Promise.all([
        fetchStudents(),
        fetchCompanies(),
        fetchOpportunities(),
        fetchApplications()
      ]);
      
      // Calculate statistics
      const activeCompaniesCount = companiesData.filter((c: Company) => c.is_active).length;
      const activeOpportunitiesCount = opportunitiesData.filter((o: Opportunity) => o.is_active).length;
      const pendingApps = applicationsData.filter((a: Application) => 
        ['Submitted', 'Under Review', 'Shortlisted'].includes(a.status)
      ).length;
      const selectedApps = applicationsData.filter((a: Application) => a.status === 'Selected').length;
      const placementRate = studentsData.length > 0 
        ? Math.round((selectedApps / studentsData.length) * 100) 
        : 0;
      
      setStats({
        totalStudents: studentsData.length,
        activeStudents: studentsData.filter((s: Student) => s.current_cgpa >= 7.0).length,
        totalCompanies: companiesData.length,
        activeCompanies: activeCompaniesCount,
        totalOpportunities: opportunitiesData.length,
        activeOpportunities: activeOpportunitiesCount,
        totalApplications: applicationsData.length,
        pendingApplications: pendingApps,
        selectedApplications: selectedApps,
        placementRate: placementRate
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchStudents, fetchCompanies, fetchOpportunities, fetchApplications]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCompanyStatus = async (companyId: number, currentStatus: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/companies/${companyId}`, {
        is_active: !currentStatus
      }, axiosConfig);
      await fetchCompanies();
      await fetchOpportunities(); // Refresh opportunities as they might be affected
      alert(`Company ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Failed to update company status');
    }
  };

  const toggleOpportunityStatus = async (opportunityId: number, currentStatus: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/opportunities/${opportunityId}`, {
        is_active: !currentStatus
      }, axiosConfig);
      await fetchOpportunities();
      alert(`Opportunity ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      alert('Failed to update opportunity status');
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

  const getRoundColor = (round: string) => {
    const colors: Record<string, string> = {
      'Application': 'bg-gray-100 text-gray-800',
      'Online Test': 'bg-cyan-100 text-cyan-800',
      'Technical Interview': 'bg-indigo-100 text-indigo-800',
      'HR Interview': 'bg-pink-100 text-pink-800',
      'Final': 'bg-amber-100 text-amber-800'
    };
    return colors[round] || 'bg-gray-100 text-gray-800';
  };

  // Filtered data based on search
  const filteredStudents = students.filter(student => 
    student.first_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.enrollment_number?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.company_name?.toLowerCase().includes(companySearch.toLowerCase()) ||
    company.industry?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title?.toLowerCase().includes(opportunitySearch.toLowerCase()) ||
    opp.company_name?.toLowerCase().includes(opportunitySearch.toLowerCase())
  );

  const filteredApplications = applications.filter(app =>
    statusFilter === 'all' ? true : app.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <div className="hidden md:flex space-x-4">
                {['overview', 'students', 'companies', 'opportunities', 'applications', 'reports'].map((tab) => (
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
                    {tab === 'students' && students.length > 0 && (
                      <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                        {students.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
                    <p className="text-xs text-green-600 mt-1">Active: {stats.activeStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Companies</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalCompanies}</p>
                    <p className="text-xs text-green-600 mt-1">Active: {stats.activeCompanies}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Opportunities</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalOpportunities}</p>
                    <p className="text-xs text-green-600 mt-1">Active: {stats.activeOpportunities}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Applications</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalApplications}</p>
                    <p className="text-xs text-blue-600 mt-1">Pending: {stats.pendingApplications}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            {applications.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Applications</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app.application_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{app.student_name}</p>
                          <p className="text-sm text-gray-600">{app.opportunity_title}</p>
                          <p className="text-xs text-gray-500">{app.company_name}</p>
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
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Top Hiring Companies</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {companies.filter(c => c.is_active).slice(0, 5).map((company) => (
                      <div key={company.company_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-gray-800">{company.company_name}</p>
                          <p className="text-sm text-gray-600">{company.industry || 'Not specified'}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">Student Management</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search by name, email, or enrollment..." 
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
            
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👨‍🎓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">
                  {studentSearch ? 'No students match your search criteria.' : 'No students have registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.enrollment_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.department?.department_name || 'Not Assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.current_cgpa >= 8 ? 'bg-green-100 text-green-800' :
                            student.current_cgpa >= 7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {student.current_cgpa}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">Company Management</h2>
              <input 
                type="text" 
                placeholder="Search companies..." 
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
                <p className="text-gray-500">
                  {companySearch ? 'No companies match your search criteria.' : 'No companies have registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr key={company.company_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{company.industry || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {company.hr_contact_name || '-'}<br/>
                          <span className="text-xs">{company.hr_contact_email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {company.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleCompanyStatus(company.company_id, company.is_active)}
                            className={`${company.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded-lg text-xs transition-colors`}
                          >
                            {company.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">Opportunity Moderation</h2>
              <input 
                type="text" 
                placeholder="Search opportunities..." 
                value={opportunitySearch}
                onChange={(e) => setOpportunitySearch(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            
            {filteredOpportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💼</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
                <p className="text-gray-500">
                  {opportunitySearch ? 'No opportunities match your search criteria.' : 'No internship opportunities have been posted yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stipend</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOpportunities.map((opp) => (
                      <tr key={opp.opportunity_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{opp.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{opp.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{opp.internship_type || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{opp.stipend_amount?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${opp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {opp.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleOpportunityStatus(opp.opportunity_id, opp.is_active)}
                            className={`${opp.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded-lg text-xs transition-colors`}
                          >
                            {opp.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">Applications Monitoring</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-500">
                  {statusFilter !== 'all' ? `No applications with status "${statusFilter}" found.` : 'No applications have been submitted yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((app) => (
                      <tr key={app.application_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{app.student_name}</div>
                          <div className="text-xs text-gray-500">{app.student_enrollment}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.opportunity_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoundColor(app.selection_round)}`}>
                            {app.selection_round}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(app.application_date).toLocaleDateString()}
                        </td>
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

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Placement Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-3">Department-wise Applications</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(() => {
                      const deptStats = new Map();
                      applications.forEach(app => {
                        const dept = app.student_name?.split(' ')[1] || 'Unknown';
                        deptStats.set(dept, (deptStats.get(dept) || 0) + 1);
                      });
                      return Array.from(deptStats.entries()).map(([dept, count]) => (
                        <div key={dept} className="flex justify-between items-center">
                          <span className="text-sm">{dept}</span>
                          <div className="flex-1 mx-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 rounded-full h-2" 
                                style={{ width: `${(count / applications.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-3">Application Status Distribution</p>
                  <div className="space-y-2">
                    {['Submitted', 'Under Review', 'Shortlisted', 'Selected', 'Rejected'].map(status => {
                      const count = applications.filter(a => a.status === status).length;
                      const percentage = applications.length > 0 ? (count / applications.length) * 100 : 0;
                      return (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-sm">{status}</span>
                          <div className="flex-1 mx-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className={`rounded-full h-2 ${getStatusColor(status).replace('bg-', 'bg-').replace('text-', '')}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">Placement Rate</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.placementRate}%</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.selectedApplications} out of {stats.totalStudents} students placed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;