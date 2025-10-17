// components/LeadDetailsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, CheckSquare, Mail, MessageCircle, FileText,
  ChevronRight, Home, Building2, MailIcon, PhoneIcon,
  IndianRupee, ArrowUpRight, ArrowDownRight, Send, Paperclip,
  Smile, Calendar, Clock, User, Video, Phone, MoreVertical,
  Search, Filter, Archive, Trash2, Plus
} from 'lucide-react';
import { getLeadById, type Lead } from '@/utils/crm';
import { getCachedLeadDetails } from '@/utils/crmCache';
import { useAuth } from '@/contexts/AuthContext';


interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

// Mock data for different tabs (you can replace these with API calls later)
const mockActivities = [
  { id: 1, action: 'Lead created', date: '2024-01-15 10:30 AM', user: 'System', type: 'created', description: 'New lead registered in system' },
  { id: 2, action: 'Initial contact made', date: '2024-01-16 02:15 PM', user: 'System', type: 'contact', description: 'Phone call - discussed basic requirements' },
  { id: 3, action: 'Product demo scheduled', date: '2024-01-17 11:00 AM', user: 'System', type: 'meeting', description: 'Demo scheduled for next week' },
  { id: 4, action: 'Proposal sent', date: '2024-01-18 04:45 PM', user: 'System', type: 'proposal', description: 'Sent enterprise proposal package' }
];

const mockTasks = [
  { id: 1, task: 'Follow up on proposal', due: '2024-01-25', priority: 'high', completed: false, assignedTo: 'Sales Team' },
  { id: 2, task: 'Schedule technical demo', due: '2024-01-30', priority: 'medium', completed: false, assignedTo: 'Technical Team' },
  { id: 3, task: 'Send contract documents', due: '2024-01-19', priority: 'high', completed: true, assignedTo: 'Sales Team' },
  { id: 4, task: 'Collect feedback', due: '2024-01-22', priority: 'low', completed: false, assignedTo: 'Sales Team' }
];

const mockEmails = [
  { id: 1, subject: 'Welcome to Our Platform', preview: 'Thank you for your interest in our services...', date: '2024-01-15 10:35 AM', read: true, type: 'sent' },
  { id: 2, subject: 'Follow-up on Demo Request', preview: 'Following up on our conversation about scheduling...', date: '2024-01-16 02:20 PM', read: true, type: 'received' },
  { id: 3, subject: 'Proposal Documents', preview: 'Attached please find the detailed proposal...', date: '2024-01-18 04:50 PM', read: false, type: 'sent' }
];

const mockWhatsAppMessages = [
  { id: 1, text: 'Hi, thanks for reaching out! How can I help you today?', time: '10:30 AM', sent: true },
  { id: 2, text: 'Hi! I\'m interested in learning more about your enterprise solutions.', time: '10:32 AM', sent: false },
  { id: 3, text: 'Great! I\'d be happy to walk you through our offerings. Would you like to schedule a demo?', time: '10:33 AM', sent: true },
  { id: 4, text: 'Yes, that would be perfect. How about next Tuesday?', time: '10:35 AM', sent: false },
  { id: 5, text: 'Tuesday works for me. I\'ll send over a calendar invite shortly.', time: '10:36 AM', sent: true }
];

const LeadDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockWhatsAppMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const employeeId = user?.employeeId || '';
  const email = user?.email || '';
  
  const tabs: Tab[] = [
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'task', label: 'Tasks', icon: CheckSquare },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'form', label: 'Lead Details', icon: FileText }
  ];

  useEffect(() => {
  const loadLead = async () => {
    setLoading(true);
    try {
      if (leadId) {
        // First, check if we have the lead in the cache
        const cachedLead = getCachedLeadDetails(leadId);
        if (cachedLead) {
          setLead(cachedLead);
          setLoading(false);
          return;
        }

        // If not in cache, then fetch from API (which will also update the cache)
        const leadData = await getLeadById(leadId, employeeId, email);
        setLead(leadData);
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  loadLead();
}, [leadId, employeeId, email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sent: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate reply after delay
    setTimeout(() => {
      const replyMsg = {
        id: messages.length + 2,
        text: 'Thanks for your message. I\'ll get back to you soon.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sent: false
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      Contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <User size={16} className="text-blue-500" />;
      case 'contact': return <Phone size={16} className="text-green-500" />;
      case 'meeting': return <Video size={16} className="text-purple-500" />;
      case 'proposal': return <FileText size={16} className="text-orange-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lead could not be found.</p>
          <button 
            onClick={() => navigate('/crm')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to CRM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button 
            onClick={() => navigate('/crm')} 
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Home size={16} />
            <span>CRM</span>
          </button>
          <ChevronRight size={16} />
          <button 
            onClick={() => navigate('/crm')}
            className="hover:text-blue-600 transition-colors"
          >
            Leads
          </button>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">{lead.name}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                <p className="text-gray-600">{lead.company} • {lead.industry}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MailIcon size={16} />
                    {lead.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon size={16} />
                    {lead.phone}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </div>
                {lead.ucc && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>UCC: {lead.ucc}</span>
                    {lead.panNumber && <span>PAN: {lead.panNumber}</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">₹{lead.value.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Lead Value</p>
              {lead.noOfEmployees && (
                <p className="text-sm text-gray-500 mt-1">Employees: {lead.noOfEmployees}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-50 mb-6 border border-gray-100 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Activity Timeline</h3>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
                      <Filter size={16} />
                      Filter
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{activity.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <p className="text-sm text-gray-500 mt-2">by {activity.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'task' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Plus size={16} />
                    New Task
                  </button>
                </div>
                <div className="grid gap-4">
                  {mockTasks.map((task) => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={task.completed}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            readOnly
                          />
                          <div>
                            <span className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.task}
                            </span>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar size={14} />
                                Due: {task.due}
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <User size={14} />
                                {task.assignedTo}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Email Communication</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Mail size={16} />
                      Compose Email
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search emails..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
                      <Filter size={16} />
                      Filter
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {mockEmails.map((email) => (
                    <div key={email.id} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!email.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full mt-2 ${email.read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {email.type === 'sent' ? `To: ${lead.email}` : `From: ${lead.email}`}
                            </span>
                            <span className="text-sm text-gray-500">{email.date}</span>
                          </div>
                          <p className="font-semibold text-gray-900 mb-1">{email.subject}</p>
                          <p className="text-sm text-gray-600 truncate">{email.preview}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Tab */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Chat Header */}
                <div className="bg-green-500 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-green-100 text-sm">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-green-100 hover:text-white transition-colors">
                        <Phone size={20} />
                      </button>
                      <button className="text-green-100 hover:text-white transition-colors">
                        <Video size={20} />
                      </button>
                      <button className="text-green-100 hover:text-white transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto bg-green-50 p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 ${
                          message.sent
                            ? 'bg-green-100 text-gray-800 rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs text-gray-500 text-right mt-1">{message.time}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-gray-100 p-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                      <Paperclip size={20} />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                      <Smile size={20} />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lead Details Tab */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Lead Information</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Edit Details
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.phone}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UCC Number</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.ucc || 'Not available'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.panNumber || 'Not available'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.company}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.industry}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lead Value</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                        ₹{lead.value.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.city || 'Unknown'}{lead.state ? `, ${lead.state}` : ''}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {lead.branchCode || 'Not available'}
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-24">
                      {lead.notes}
                    </div>
                  </div>
                  {/* Additional Fields */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lead.referredBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Referred By</label>
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                          {lead.referredBy}
                        </div>
                      </div>
                    )}
                    {lead.noOfEmployees && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. of Employees</label>
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                          {lead.noOfEmployees}
                        </div>
                      </div>
                    )}
                    {lead.tradeDone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trade Done</label>
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                          {lead.tradeDone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsPage;