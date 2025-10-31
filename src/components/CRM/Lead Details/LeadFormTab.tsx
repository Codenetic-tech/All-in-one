// components/CRM/Lead Details/LeadFormTab.tsx
import React, { useState } from 'react';
import { Save, RefreshCw, Edit3, X, User, Mail, Phone, MapPin, Building, Globe, BadgeInfo, FileText, Users, TrendingUp } from 'lucide-react';
import { type Lead } from '@/utils/crm';
import { updateCachedLeadDetails } from '@/utils/crmCache';

interface LeadFormTabProps {
  lead: Lead;
  leadId: string;
  employeeId: string;
  email: string;
  onLeadUpdate: (updatedLead: Lead) => void;
}

// Indian languages for the dropdown
const indianLanguages = [
  'Tamil', 'Hindi', 'English', 'Telugu', 'Kannada', 'Malayalam',
];

// Status options for the dropdown
const statusOptions = [
  { value: 'new', label: 'New', },
  { value: 'Contacted', label: 'Contacted', },
  { value: 'qualified', label: 'Qualified', },
  { value: 'followup', label: 'Followup', },
  { value: 'won', label: 'Won', },
  { value: 'Not Interested', label: 'Not Interested',  },
  { value: 'Call Back', label: 'Call Back', },
  { value: 'Switch off', label: 'Switch off', },
  { value: 'RNR', label: 'RNR', },
];

// Status colors for display
const getStatusColor = (status: Lead['status']) => {
  const colors = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    Contacted: 'bg-purple-50 text-purple-700 border-purple-200',
    qualified: 'bg-green-50 text-green-700 border-green-200',
    followup: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Not Interested': 'bg-red-50 text-red-700 border-red-200',
    'Call Back': 'bg-orange-50 text-orange-700 border-orange-200',
    'Switch off': 'bg-gray-50 text-gray-700 border-gray-200',
    'RNR': 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };
  return colors[status];
};

const LeadFormTab: React.FC<LeadFormTabProps> = ({ 
  lead, 
  leadId, 
  employeeId, 
  email, 
  onLeadUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [updating, setUpdating] = useState(false);

  // Function to update lead
  const updateLead = async () => {
    if (!leadId || !lead || updating) return;
    
    setUpdating(true);
    try {
      // Create a clean payload without any existing source field
      const { source: _, ...cleanEditedLead } = editedLead;
      
      const response = await fetch('https://n8n.gopocket.in/webhook/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'Update Lead',
          employeeId: employeeId,
          email: email,
          leadid: leadId,
          ...cleanEditedLead
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update lead: ${response.status}`);
      }

      // Update local state and cache
      const updatedLead = { ...lead, ...cleanEditedLead };
      onLeadUpdate(updatedLead);
      updateCachedLeadDetails(leadId, updatedLead);
      
      // Exit edit mode
      setIsEditing(false);
      setEditedLead({});
      
    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedLead({});
    } else {
      // Start editing - initialize with current lead data
      setEditedLead(lead || {});
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field: keyof Lead, value: any) => {
    setEditedLead(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateLead = () => {
    updateLead();
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option;
  };

  return (
    <div className="space-y-6">

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lead Information</h3>
                <p className="text-sm text-gray-600">Manage lead details and preferences</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleUpdateLead}
                    disabled={updating}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleEditToggle}
                    className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 border border-gray-200"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleEditToggle}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 shadow-md"
                >
                  <Edit3 size={16} />
                  Edit Details
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Personal Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.name || lead.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                        {lead.name}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedLead.email || lead.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter email"
                        />
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {lead.email}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedLead.phone || lead.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      {isEditing ? (
                        <select
                          value={editedLead.language || lead.language || ''}
                          onChange={(e) => handleFieldChange('language', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        >
                          <option value="">Select Language</option>
                          {indianLanguages.map(language => (
                            <option key={language} value={language}>{language}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          {lead.language || 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      {isEditing ? (
                        <select
                          value={editedLead.status || lead.status || 'new'}
                          onChange={(e) => handleFieldChange('status', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(lead.status)} flex items-center gap-2 w-fit`}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Documents Section */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Location & Documents
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.city || lead.city || ''}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter city"
                        />
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900">
                          {lead.city || 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.state || lead.state || ''}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter state"
                        />
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900">
                          {lead.state || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UCC Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.ucc || lead.ucc || ''}
                          onChange={(e) => handleFieldChange('ucc', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter UCC number"
                        />
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                          <BadgeInfo className="w-4 h-4 text-gray-400" />
                          {lead.ucc || 'Not available'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.panNumber || lead.panNumber || ''}
                          onChange={(e) => handleFieldChange('panNumber', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter PAN number"
                        />
                      ) : (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          {lead.panNumber || 'Not available'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Company Information Section */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  Company Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.company || lead.company || ''}
                        onChange={(e) => handleFieldChange('company', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Enter company name"
                      />
                    ) : (
                      <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900">
                        {lead.company}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.industry || lead.industry || ''}
                        onChange={(e) => handleFieldChange('industry', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Enter industry"
                      />
                    ) : (
                      <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900">
                        {lead.industry}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lead Value</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedLead.value || lead.value || 0}
                        onChange={(e) => handleFieldChange('value', Number(e.target.value))}
                        className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Enter lead value"
                      />
                    ) : (
                      <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold text-lg text-green-600">
                        ₹{(lead.value || 0).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.branchCode || lead.branchCode || ''}
                        onChange={(e) => handleFieldChange('branchCode', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Enter branch code"
                      />
                    ) : (
                      <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900">
                        {lead.branchCode || 'Not available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Additional Details
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Referred By</label>
                        <input
                          type="text"
                          value={editedLead.referredBy || lead.referredBy || ''}
                          onChange={(e) => handleFieldChange('referredBy', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter referrer name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. of Employees</label>
                        <input
                          type="number"
                          value={editedLead.noOfEmployees || lead.noOfEmployees || ''}
                          onChange={(e) => handleFieldChange('noOfEmployees', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter number of employees"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trade Done</label>
                        <input
                          type="text"
                          value={editedLead.tradeDone || lead.tradeDone || ''}
                          onChange={(e) => handleFieldChange('tradeDone', e.target.value)}
                          className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          placeholder="Enter trade details"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {lead.referredBy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Referred By</label>
                          <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900">
                            {lead.referredBy}
                          </div>
                        </div>
                      )}
                      {lead.noOfEmployees && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">No. of Employees</label>
                          <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            {lead.noOfEmployees}
                          </div>
                        </div>
                      )}
                      {lead.tradeDone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Trade Done</label>
                          <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            {lead.tradeDone}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section - Full Width */}
          <div className="mt-8 bg-gray-50/50 rounded-xl p-5 border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Notes
            </h4>
            {isEditing ? (
              <textarea
                value={editedLead.notes || lead.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={4}
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none"
                placeholder="Add notes about this lead..."
              />
            ) : (
              <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 min-h-24 whitespace-pre-wrap">
                {lead.notes || 'No notes available'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadFormTab;