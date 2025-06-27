import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { domainDiscoveryAPI, scrapingAPI } from '../lib/api';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Loader2, Search, Globe, Database } from 'lucide-react';

const BulkOutreachPage = () => {
  const [industryInput, setIndustryInput] = useState('');
  const [currentDiscoveryTask, setCurrentDiscoveryTask] = useState(null);
  const [currentScrapingTask, setCurrentScrapingTask] = useState(null);
  const { addNotification } = useAppStore();

  // Domain Discovery Mutation
  const discoveryMutation = useMutation({
    mutationFn: domainDiscoveryAPI.initiate,
    onSuccess: (response) => {
      setCurrentDiscoveryTask(response.data);
      addNotification({
        type: 'success',
        title: 'Discovery Started',
        message: 'URL discovery task has been initiated.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Discovery Failed',
        message: error.response?.data?.error || 'Failed to start discovery task.',
      });
    },
  });

  // Scraping Mutation
  const scrapingMutation = useMutation({
    mutationFn: scrapingAPI.initiate,
    onSuccess: (response) => {
      setCurrentScrapingTask(response.data);
      addNotification({
        type: 'success',
        title: 'Scraping Started',
        message: 'Bulk scraping task has been initiated.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Scraping Failed',
        message: error.response?.data?.error || 'Failed to start scraping task.',
      });
    },
  });

  // Poll discovery task status
  const { data: discoveryStatus } = useQuery({
    queryKey: ['discoveryStatus', currentDiscoveryTask?.id],
    queryFn: () => domainDiscoveryAPI.getStatus(currentDiscoveryTask.id),
    enabled:
      !!currentDiscoveryTask &&
      currentDiscoveryTask.status !== 'completed' &&
      currentDiscoveryTask.status !== 'failed',
    refetchInterval: 2000,
    onSuccess: (response) => {
      console.log('Polled discovery status:', response.data);
      setCurrentDiscoveryTask(response.data);
    },
  });

  // Poll scraping task status
  const { data: scrapingStatus } = useQuery({
    queryKey: ['scrapingStatus', currentScrapingTask?.id],
    queryFn: () => scrapingAPI.getStatus(currentScrapingTask.id),
    enabled:
      !!currentScrapingTask &&
      currentScrapingTask.status !== 'completed' &&
      currentScrapingTask.status !== 'failed',
    refetchInterval: 2000,
    onSuccess: (response) => {
      console.log('Polled scraping status:', response.data);
      setCurrentScrapingTask(response.data);
    },
  });

  const handleStartDiscovery = (e) => {
    e.preventDefault();
    if (!industryInput.trim()) return;

    discoveryMutation.mutate({
      industry_or_seed_domain: industryInput.trim(),
    });
  };

  const handleStartScraping = () => {
    if (!currentDiscoveryTask || currentDiscoveryTask.status !== 'completed') return;

    scrapingMutation.mutate({
      discovery_task_id: currentDiscoveryTask.id,
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'outline',
      running: 'secondary',
      completed: 'default',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getProgress = (task) => {
    if (!task) return 0;
    if (task.status === 'completed') return 100;
    if (task.status === 'failed') return 0;
    if (task.status === 'running') return 50;
    return 0;
  };

  const getScrapingProgress = (task) => {
    if (!task || !task.total_urls) return 0;
    return Math.round((task.processed_urls / task.total_urls) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Outreach</h1>
        <p className="mt-2 text-gray-600">
          Discover URLs and scrape contact information at scale.
        </p>
      </div>

      {/* Step 1: URL Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Step 1: URL Discovery
          </CardTitle>
          <CardDescription>
            Enter an industry or seed domain to discover relevant URLs for scraping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartDiscovery} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry or Seed Domain</Label>
              <Input
                id="industry"
                placeholder="e.g., 'SaaS companies' or 'https://example.com'"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                disabled={discoveryMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              disabled={discoveryMutation.isPending || !industryInput.trim()}
            >
              {discoveryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Discovery...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Start URL Discovery
                </>
              )}
            </Button>
          </form>

          {currentDiscoveryTask && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Discovery Status:</span>
                {getStatusBadge(currentDiscoveryTask.status)}
              </div>

              <Progress value={getProgress(currentDiscoveryTask)} className="w-full" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Task ID:</span>
                  <p className="font-mono text-xs">{currentDiscoveryTask.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">URLs Found:</span>
                  <p className="font-semibold">{currentDiscoveryTask.discovered_urls_count}</p>
                </div>
              </div>

              {currentDiscoveryTask.error_message && (
                <Alert variant="destructive">
                  <AlertDescription>{currentDiscoveryTask.error_message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Bulk Scraping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Step 2: Bulk Scraping
          </CardTitle>
          <CardDescription>
            Scrape contact information from the discovered URLs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleStartScraping}
              disabled={
                scrapingMutation.isPending ||
                !currentDiscoveryTask ||
                currentDiscoveryTask.status !== 'completed'
              }
            >
              {scrapingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Scraping...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Start Bulk Scraping
                </>
              )}
            </Button>

            {!currentDiscoveryTask && (
              <Alert>
                <AlertDescription>
                  Complete URL discovery first to enable bulk scraping.
                </AlertDescription>
              </Alert>
            )}

            {currentDiscoveryTask && currentDiscoveryTask.status !== 'completed' && (
              <Alert>
                <AlertDescription>
                  Wait for URL discovery to complete before starting scraping.
                </AlertDescription>
              </Alert>
            )}

            {currentScrapingTask && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Scraping Status:</span>
                  {getStatusBadge(currentScrapingTask.status)}
                </div>

                <Progress value={getScrapingProgress(currentScrapingTask)} className="w-full" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <p className="font-semibold">
                      {currentScrapingTask.processed_urls || 0} / {currentScrapingTask.total_urls || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Successful:</span>
                    <p className="font-semibold text-green-600">
                      {currentScrapingTask.successful_urls || 0}
                    </p>
                  </div>
                </div>

                {currentScrapingTask.error_message && (
                  <Alert variant="destructive">
                    <AlertDescription>{currentScrapingTask.error_message}</AlertDescription>
                  </Alert>
                )}

                {currentScrapingTask.status === 'completed' && (
                  <Alert>
                    <AlertDescription>
                      Scraping completed! {currentScrapingTask.successful_urls} contacts were successfully scraped.
                      You can now view them in the Contacts section.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkOutreachPage;
