// components/CRM/Lead Details/LeadFormTab.tsx
import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Lead Information</h3>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleUpdateLead}
                  disabled={updating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Update
                    </>
                  )}
                </button>
                <button 
                  onClick={handleEditToggle}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={handleEditToggle}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Details
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLead.name || lead.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.name}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedLead.email || lead.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.email}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              {isEditing ? (
                <select
                  value={editedLead.language || lead.language || ''}
                  onChange={(e) => handleFieldChange('language', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Language</option>
                  {indianLanguages.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.language || 'Not available'}
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.phone}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLead.city || lead.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.city || 'Not available'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UCC Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLead.ucc || lead.ucc || ''}
                  onChange={(e) => handleFieldChange('ucc', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.panNumber || 'Not available'}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLead.company || lead.company || ''}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                  ₹{(lead.value || 0).toLocaleString()}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="grid grid-cols-2 gap-2">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      placeholder="City"
                      value={editedLead.city || lead.city || ''}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={editedLead.state || lead.state || ''}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </>
                ) : (
                  <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 col-span-2">
                    {lead.city || 'Unknown'}{lead.state ? `, ${lead.state}` : ''}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedLead.branchCode || lead.branchCode || ''}
                  onChange={(e) => handleFieldChange('branchCode', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {lead.branchCode || 'Not available'}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            {isEditing ? (
              <textarea
                value={editedLead.notes || lead.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            ) : (
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-24">
                {lead.notes}
              </div>
            )}
          </div>
          {/* Additional Fields */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referred By</label>
                  <input
                    type="text"
                    value={editedLead.referredBy || lead.referredBy || ''}
                    onChange={(e) => handleFieldChange('referredBy', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. of Employees</label>
                  <input
                    type="number"
                    value={editedLead.noOfEmployees || lead.noOfEmployees || ''}
                    onChange={(e) => handleFieldChange('noOfEmployees', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trade Done</label>
                  <input
                    type="text"
                    value={editedLead.tradeDone || lead.tradeDone || ''}
                    onChange={(e) => handleFieldChange('tradeDone', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadFormTab;