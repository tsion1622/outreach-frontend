import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsAPI, contactsAPI, trackingAPI } from '../lib/api';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { 
  Mail, 
  Plus, 
  Send, 
  Eye, 
  MousePointer,
  Users,
  Loader2,
  BarChart3
} from 'lucide-react';

const CampaignsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    template_content: '',
    contact_ids: [],
  });
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  
  const { addNotification } = useAppStore();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsAPI.getAll,
  });

  // Fetch contacts for selection
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', { page: 1, page_size: 1000 }],
    queryFn: () => contactsAPI.getAll({ page: 1, page_size: 1000 }),
    enabled: createDialogOpen,
  });

  // Fetch tracking data
  const { data: trackingData } = useQuery({
    queryKey: ['tracking', selectedCampaign?.id],
    queryFn: () => trackingAPI.getSummary(selectedCampaign.id),
    enabled: !!selectedCampaign && trackingDialogOpen,
  });

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: campaignsAPI.create,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Campaign Created',
        message: 'Email campaign created successfully.',
      });
      setCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries(['campaigns']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.error || 'Failed to create campaign.',
      });
    },
  });

  // Send campaign mutation
  const sendMutation = useMutation({
    mutationFn: campaignsAPI.send,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Campaign Sent',
        message: 'Email campaign is being sent.',
      });
      queryClient.invalidateQueries(['campaigns']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Send Failed',
        message: error.response?.data?.error || 'Failed to send campaign.',
      });
    },
  });

  const campaigns = campaignsData?.data || [];
  const contacts = contactsData?.data?.results || [];

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      template_content: '',
      contact_ids: [],
    });
    setSelectedContacts(new Set());
  };

  const handleCreateCampaign = () => {
    const contactIds = Array.from(selectedContacts);
    createMutation.mutate({
      ...formData,
      contact_ids: contactIds,
    });
  };

  const handleSendCampaign = (campaignId) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      sendMutation.mutate(campaignId);
    }
  };

  const handleContactSelect = (contactId, checked) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAllContacts = (checked) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'outline',
      'sending': 'secondary',
      'completed': 'default',
      'failed': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const openTrackingDialog = (campaign) => {
    setSelectedCampaign(campaign);
    setTrackingDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your email marketing campaigns.
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
              <DialogDescription>
                Create a new email campaign and select contacts to send to.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Campaign Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template">Email Template</Label>
                  <Textarea
                    id="template"
                    rows={8}
                    value={formData.template_content}
                    onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                    placeholder="Enter email template. Use [name], [email], [city], etc. for personalization."
                  />
                  <p className="text-xs text-gray-500">
                    Use placeholders like [name], [email], [city], [country], [phone] for personalization.
                  </p>
                </div>
              </div>

              {/* Contact Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Contacts ({selectedContacts.size} selected)</Label>
                  <Checkbox
                    checked={selectedContacts.size === contacts.length && contacts.length > 0}
                    onCheckedChange={handleSelectAllContacts}
                  />
                </div>
                
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedContacts.has(contact.id)}
                              onCheckedChange={(checked) => handleContactSelect(contact.id, checked)}
                            />
                          </TableCell>
                          <TableCell>{contact.name || 'N/A'}</TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>
                            {[contact.city, contact.country].filter(Boolean).join(', ') || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={createMutation.isPending || selectedContacts.size === 0}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Campaigns ({campaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first email campaign.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>{campaign.contact_count || 0}</TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTrackingDialog(campaign)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.name} - Performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {trackingData && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                        <p className="text-2xl font-bold">{trackingData.data.total_recipients}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Eye className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Open Rate</p>
                        <p className="text-2xl font-bold">{trackingData.data.open_rate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <MousePointer className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Click Rate</p>
                        <p className="text-2xl font-bold">{trackingData.data.click_rate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Mail className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Opens</p>
                        <p className="text-2xl font-bold">{trackingData.data.opens}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Open Rate</span>
                    <span>{trackingData.data.open_rate}%</span>
                  </div>
                  <Progress value={trackingData.data.open_rate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Click Rate</span>
                    <span>{trackingData.data.click_rate}%</span>
                  </div>
                  <Progress value={trackingData.data.click_rate} className="h-2" />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsPage;

