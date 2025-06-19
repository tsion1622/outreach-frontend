import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { contactsAPI, campaignsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Mail, Search, TrendingUp } from 'lucide-react';

const DashboardPage = () => {
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', { page: 1, page_size: 1 }],
    queryFn: () => contactsAPI.getAll({ page: 1, page_size: 1 }),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsAPI.getAll,
  });

  const totalContacts = contactsData?.data?.count || 0;
  const totalCampaigns = campaignsData?.data?.length || 0;
  const activeCampaigns = campaignsData?.data?.filter(c => c.status === 'sending')?.length || 0;

  const stats = [
    {
      name: 'Total Contacts',
      value: totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Campaigns',
      value: totalCampaigns.toLocaleString(),
      icon: Mail,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Campaigns',
      value: activeCampaigns.toLocaleString(),
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Scraping Tasks',
      value: '0',
      icon: Search,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const recentCampaigns = campaignsData?.data?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your marketing outreach platform. Here's an overview of your activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>
              Your latest email campaigns and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                    </div>
                    <Badge variant={
                      campaign.status === 'completed' ? 'default' :
                      campaign.status === 'sending' ? 'secondary' :
                      campaign.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {campaign.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No campaigns yet. Create your first campaign to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to help you get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium">Start Bulk Outreach</p>
                    <p className="text-sm text-gray-500">Discover and scrape new contacts</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium">Upload Contacts</p>
                    <p className="text-sm text-gray-500">Import contacts from CSV</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium">Create Campaign</p>
                    <p className="text-sm text-gray-500">Send personalized emails</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

