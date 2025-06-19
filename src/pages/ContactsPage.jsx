import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../lib/api';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  Upload, 
  Trash2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

const ContactsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  
  const { addNotification } = useAppStore();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: () => contactsAPI.getAll({
      page: currentPage,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    }),
  });

  // Upload CSV mutation
  const uploadMutation = useMutation({
    mutationFn: contactsAPI.uploadCSV,
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        title: 'Upload Successful',
        message: `${response.data.contacts_created} contacts imported successfully.`,
      });
      setUploadDialogOpen(false);
      setUploadFile(null);
      queryClient.invalidateQueries(['contacts']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.error || 'Failed to upload contacts.',
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: contactsAPI.bulkDelete,
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        title: 'Contacts Deleted',
        message: `${response.data.deleted_count} contacts deleted successfully.`,
      });
      setSelectedContacts(new Set());
      queryClient.invalidateQueries(['contacts']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.response?.data?.error || 'Failed to delete contacts.',
      });
    },
  });

  const contacts = contactsData?.data?.results || [];
  const totalPages = Math.ceil((contactsData?.data?.count || 0) / 50);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSelectContact = (contactId, checked) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedContacts.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedContacts.size} contacts?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedContacts));
    }
  };

  const handleUpload = () => {
    if (!uploadFile) return;
    uploadMutation.mutate(uploadFile);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Success': 'default',
      'Failed': 'destructive',
      'Imported': 'secondary',
      'Skipped': 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-2 text-gray-600">
            Manage your scraped and imported contacts.
          </p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Contacts CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file with contact information. Required columns: name, email, phone, city, country.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!uploadFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Imported">Imported</SelectItem>
                  <SelectItem value="Skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedContacts.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedContacts.size})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Contacts ({contactsData?.data?.count || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading a CSV or running bulk outreach.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.size === contacts.length && contacts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={(checked) => handleSelectContact(contact.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {contact.name || 'N/A'}
                      </TableCell>
                      <TableCell>{contact.email || 'N/A'}</TableCell>
                      <TableCell>{contact.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {[contact.city, contact.country].filter(Boolean).join(', ') || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                        {contact.source_url}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsPage;

