
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import githubService from '@/services/github';
import pineconeService from '@/services/pinecone';

const formSchema = z.object({
  githubApiKey: z.string().optional(),
  pineconeApiKey: z.string().min(1, 'Pinecone API key is required'),
  pineconeEnvironment: z.string().min(1, 'Pinecone environment is required'),
  pineconeIndex: z.string().min(1, 'Pinecone index name is required'),
  pineconeProjectId: z.string().min(1, 'Pinecone project ID is required'),
});

type FormValues = z.infer<typeof formSchema>;

const ApiKeysForm: React.FC = () => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState({
    github: false,
    pinecone: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      githubApiKey: '',
      pineconeApiKey: '',
      pineconeEnvironment: '',
      pineconeIndex: '',
      pineconeProjectId: '',
    },
  });

  // Load saved API keys from localStorage on component mount
  useEffect(() => {
    const savedGithubKey = localStorage.getItem('anarepo_github_api_key');
    const savedPineconeKey = localStorage.getItem('anarepo_pinecone_api_key');
    const savedPineconeEnv = localStorage.getItem('anarepo_pinecone_environment');
    const savedPineconeIndex = localStorage.getItem('anarepo_pinecone_index');
    const savedPineconeProjectId = localStorage.getItem('anarepo_pinecone_project_id');

    if (savedGithubKey) {
      form.setValue('githubApiKey', savedGithubKey);
      githubService.setApiKey(savedGithubKey);
      setIsConfigured(prev => ({ ...prev, github: true }));
    }

    if (savedPineconeKey && savedPineconeEnv && savedPineconeIndex && savedPineconeProjectId) {
      form.setValue('pineconeApiKey', savedPineconeKey);
      form.setValue('pineconeEnvironment', savedPineconeEnv);
      form.setValue('pineconeIndex', savedPineconeIndex);
      form.setValue('pineconeProjectId', savedPineconeProjectId);
      
      pineconeService.configure({
        apiKey: savedPineconeKey,
        environment: savedPineconeEnv,
        indexName: savedPineconeIndex,
        projectId: savedPineconeProjectId,
      });
      
      setIsConfigured(prev => ({ ...prev, pinecone: true }));
    }
  }, [form]);

  const onSubmit = (values: FormValues) => {
    try {
      // Save GitHub API key if provided
      if (values.githubApiKey) {
        localStorage.setItem('anarepo_github_api_key', values.githubApiKey);
        githubService.setApiKey(values.githubApiKey);
        setIsConfigured(prev => ({ ...prev, github: true }));
      }

      // Save Pinecone configuration
      localStorage.setItem('anarepo_pinecone_api_key', values.pineconeApiKey);
      localStorage.setItem('anarepo_pinecone_environment', values.pineconeEnvironment);
      localStorage.setItem('anarepo_pinecone_index', values.pineconeIndex);
      localStorage.setItem('anarepo_pinecone_project_id', values.pineconeProjectId);
      
      pineconeService.configure({
        apiKey: values.pineconeApiKey,
        environment: values.pineconeEnvironment,
        indexName: values.pineconeIndex,
        projectId: values.pineconeProjectId,
      });
      
      setIsConfigured(prev => ({ ...prev, pinecone: true }));

      toast({
        title: 'API keys saved',
        description: 'Your API keys have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save API keys. Please try again.',
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">API Configuration</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">GitHub API</h3>
            <FormField
              control={form.control}
              name="githubApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub API Key (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your GitHub API key"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Using a GitHub API key will increase rate limits. Leave blank to use public access.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold">Pinecone Vector Database</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Required for persistent memory across sessions. Create a free account at{' '}
                <a 
                  href="https://www.pinecone.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  pinecone.io
                </a>
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="pineconeApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pinecone API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your Pinecone API key"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pineconeEnvironment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pinecone Environment</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., us-west4-gcp-free"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pineconeIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pinecone Index Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., anarepo-index"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pineconeProjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pinecone Project ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your Pinecone project ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" className="w-full">
            Save API Keys
          </Button>
          
          <div className="flex flex-col gap-2 text-center text-sm">
            <p>
              GitHub API: {isConfigured.github ? '✅ Configured' : '❌ Not configured'}
            </p>
            <p>
              Pinecone: {isConfigured.pinecone ? '✅ Configured' : '❌ Not configured'}
            </p>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default ApiKeysForm;
