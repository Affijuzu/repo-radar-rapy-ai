
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
import { API_KEYS } from '@/config/apiConfig';

const formSchema = z.object({
  githubApiKey: z.string().min(1, 'GitHub API key is required'),
  pineconeApiKey: z.string().min(1, 'Pinecone API key is required'),
  pineconeEnvironment: z.string().min(1, 'Pinecone environment is required'),
  pineconeIndex: z.string().min(1, 'Pinecone index name is required'),
  pineconeProjectId: z.string().min(1, 'Pinecone project ID is required'),
  openaiApiKey: z.string().min(1, 'OpenAI API key is required for embeddings'),
});

type FormValues = z.infer<typeof formSchema>;

const ApiKeysForm: React.FC = () => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState({
    github: false,
    pinecone: false,
    openai: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      githubApiKey: '',
      pineconeApiKey: '',
      pineconeEnvironment: '',
      pineconeIndex: 'anarepo-index',
      pineconeProjectId: '',
      openaiApiKey: '',
    },
  });

  // Load API keys from localStorage or config on component mount
  useEffect(() => {
    // Set default values from the provided tokens
    const githubToken = API_KEYS.GITHUB_TOKEN;
    const pineconeApiKey = API_KEYS.PINECONE_API_KEY;
    const pineconeEnv = API_KEYS.PINECONE_ENVIRONMENT;
    const openaiApiKey = API_KEYS.OPENAI_API_KEY;
    
    // Try to get from localStorage first, otherwise use the defaults
    const savedGithubKey = localStorage.getItem('anarepo_github_api_key') || githubToken;
    const savedPineconeKey = localStorage.getItem('anarepo_pinecone_api_key') || pineconeApiKey;
    const savedPineconeEnv = localStorage.getItem('anarepo_pinecone_environment') || pineconeEnv;
    const savedPineconeIndex = localStorage.getItem('anarepo_pinecone_index') || 'anarepo-index';
    const savedPineconeProjectId = localStorage.getItem('anarepo_pinecone_project_id') || '';
    const savedOpenaiApiKey = localStorage.getItem('anarepo_openai_api_key') || openaiApiKey;

    if (savedGithubKey) {
      form.setValue('githubApiKey', savedGithubKey);
      githubService.setApiKey(savedGithubKey);
      setIsConfigured(prev => ({ ...prev, github: true }));
    }

    if (savedPineconeKey && savedPineconeEnv && savedPineconeIndex) {
      form.setValue('pineconeApiKey', savedPineconeKey);
      form.setValue('pineconeEnvironment', savedPineconeEnv);
      form.setValue('pineconeIndex', savedPineconeIndex);
      form.setValue('pineconeProjectId', savedPineconeProjectId);
      
      // Configure Pinecone service
      pineconeService.configure({
        apiKey: savedPineconeKey,
        environment: savedPineconeEnv,
        indexName: savedPineconeIndex,
        projectId: savedPineconeProjectId,
        openaiApiKey: savedOpenaiApiKey,
      });
      
      setIsConfigured(prev => ({ ...prev, pinecone: true }));
    }
    
    if (savedOpenaiApiKey) {
      form.setValue('openaiApiKey', savedOpenaiApiKey);
      setIsConfigured(prev => ({ ...prev, openai: true }));
    }
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Save GitHub API key
      localStorage.setItem('anarepo_github_api_key', values.githubApiKey);
      githubService.setApiKey(values.githubApiKey);
      setIsConfigured(prev => ({ ...prev, github: true }));

      // Test GitHub API connection
      const testRepo = await githubService.getRepoData('facebook', 'react');
      if (!testRepo) {
        toast({
          variant: 'destructive',
          title: 'GitHub API Error',
          description: 'Could not connect to GitHub API. Please check your token.',
        });
        setIsConfigured(prev => ({ ...prev, github: false }));
        return;
      }

      // Save OpenAI API key
      localStorage.setItem('anarepo_openai_api_key', values.openaiApiKey);
      setIsConfigured(prev => ({ ...prev, openai: true }));

      // Save Pinecone configuration
      localStorage.setItem('anarepo_pinecone_api_key', values.pineconeApiKey);
      localStorage.setItem('anarepo_pinecone_environment', values.pineconeEnvironment);
      localStorage.setItem('anarepo_pinecone_index', values.pineconeIndex);
      localStorage.setItem('anarepo_pinecone_project_id', values.pineconeProjectId);
      
      // Configure Pinecone service with the new settings
      pineconeService.configure({
        apiKey: values.pineconeApiKey,
        environment: values.pineconeEnvironment,
        indexName: values.pineconeIndex,
        projectId: values.pineconeProjectId,
        openaiApiKey: values.openaiApiKey,
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
        description: 'Failed to save API keys. Please check console for details.',
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
                  <FormLabel>GitHub API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your GitHub API key"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Personal access token with repo scope to access GitHub API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold">OpenAI (for Embeddings)</h3>
              <FormField
                control={form.control}
                name="openaiApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OpenAI API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your OpenAI API key"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Used for creating embeddings for vector storage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                      placeholder="e.g., gcp-starter"
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
                  <FormDescription>
                    Optional for some Pinecone plans
                  </FormDescription>
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
              OpenAI: {isConfigured.openai ? '✅ Configured' : '❌ Not configured'}
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
