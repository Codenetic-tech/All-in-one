// AddLeadDialog.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, RefreshCw, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddLeadDialogProps {
  onLeadAdded?: () => void;
}

export const AddLeadDialog: React.FC<AddLeadDialogProps> = ({ onLeadAdded }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    leadSource: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.name.trim() || !formData.mobileNumber.trim()) {
        throw new Error('Name and Mobile Number are required');
      }

      // Mobile number validation (basic)
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobileNumber.replace(/\D/g, ''))) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      // Email validation (optional but if provided, should be valid)
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'add new lead',
          name: formData.name.trim(),
          phone: formData.mobileNumber.trim(),
          email: formData.email.trim(),
          leadSource: formData.leadSource.trim(),
          employeeId: user?.employeeId || '',
          userEmail: user?.email || '', // Logged in user's email
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add lead: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Add lead response:', result);

      // Reset form and close dialog
      setFormData({
        name: '',
        mobileNumber: '',
        email: '',
        leadSource: ''
      });
      setIsOpen(false);
      
      // Call callback if provided
      if (onLeadAdded) {
        onLeadAdded();
      }

    } catch (error: any) {
      console.error('Error adding lead:', error);
      setError(error.message || 'Failed to add lead. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        name: '',
        mobileNumber: '',
        email: '',
        leadSource: ''
      });
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Add New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter lead name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="text-sm font-medium">
              Mobile Number *
            </Label>
            <Input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email ID
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadSource" className="text-sm font-medium">
              Lead Source
            </Label>
            <select
              id="leadSource"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select lead source</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Social Media">Social Media</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Email Campaign">Email Campaign</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};