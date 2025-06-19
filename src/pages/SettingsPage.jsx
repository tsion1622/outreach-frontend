import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smtpAPI, authAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { 
  Settings, 
  Mail, 
  User, 
  Save,
  Loader2,
  CheckCircle
} from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { addNotification } = useAppStore();
  const queryClient = useQueryClient();
  
  const [smtpData, setSmtpData] = useState({
    smtp_server: '',
    smtp_port: 587,
    username: '',
    password: '',
    from_name: '',
  });

  // Fetch SMTP configuration
  const { data: smtpConfig, isLoading: smtpLoading } = useQuery({
    queryKey: ['smtp-config'],
    queryFn: smtpAPI.get,
    onSuccess: (response) => {
      if (response.data) {
        setSmtpData({
          smtp_server: response.data.smtp_server || '',
          smtp_port: response.data.smtp_port || 587,
          username: response.data.username || '',
          password: '', // Don't populate password for security
          from_name: response.data.from_name || '',
        });
      }
    },
  });

  // Update SMTP configuration
  const smtpMutation = useMutation({
    mutationFn: smtpAPI.update,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'SMTP configuration updated successfully.',
      });
      queryClient.invalidateQueries(['smtp-config']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to update SMTP configuration.',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      logout();
      addNotification({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
      });
    },
    onError: () => {
      // Even if the API call fails, we should still log out locally
      logout();
    },
  });

  const handleSMTPSubmit = (e) => {
    e.preventDefault();
    
    // Only include password if it's been changed
    const updateData = { ...smtpData };
    if (!updateData.password) {
      delete updateData.password;
    }
    
    smtpMutation.mutate(updateData);
  };

  const handleSMTPChange = (field, value) => {
    setSmtpData({
      ...smtpData,
      [field]: value,
    });
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logoutMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and email configuration.
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Username</Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your account is active and ready to use.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Configure your email server settings for sending campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {smtpLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSMTPSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_server">SMTP Server</Label>
                  <Input
                    id="smtp_server"
                    value={smtpData.smtp_server}
                    onChange={(e) => handleSMTPChange('smtp_server', e.target.value)}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={smtpData.smtp_port}
                    onChange={(e) => handleSMTPChange('smtp_port', parseInt(e.target.value))}
                    placeholder="587"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username/Email</Label>
                  <Input
                    id="username"
                    value={smtpData.username}
                    onChange={(e) => handleSMTPChange('username', e.target.value)}
                    placeholder="your-email@gmail.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={smtpData.password}
                    onChange={(e) => handleSMTPChange('password', e.target.value)}
                    placeholder="Leave empty to keep current password"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={smtpData.from_name}
                  onChange={(e) => handleSMTPChange('from_name', e.target.value)}
                  placeholder="Your Name or Company"
                  required
                />
              </div>
              
              <Alert>
                <AlertDescription>
                  <strong>Security Note:</strong> Your SMTP credentials are encrypted and stored securely. 
                  For Gmail, you may need to use an App Password instead of your regular password.
                </AlertDescription>
              </Alert>
              
              <Button
                type="submit"
                disabled={smtpMutation.isPending}
              >
                {smtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save SMTP Settings
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account and session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Sign Out</h4>
                <p className="text-sm text-gray-500">
                  Sign out of your account on this device.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;

