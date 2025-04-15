
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
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import githubService from '@/services/github';
import pineconeService from '@/services/pinecone';
import { API_KEYS } from '@/config/apiConfig';

// Component imports
import GithubApiSection from './GithubApiSection';
import OpenAiSection from './OpenAiSection';
import PineconeSection from './PineconeSection';
import StatusIndicator from './StatusIndicator';

// Form schema
const formSchema = z.object({
  githubApiKey: z.string().min(1, 'GitHub API key is required'),
  pineconeApiKey: z.string().min(1, 'Pinecone API key is required'),
  pineconeEnvironment: z.string().min(1, 'Pinecone environment is required'),
  pineconeIndex: z.string().min(1, 'Pinecone index name is required'),
  pineconeProjectId: z.string().min(1, 'Pinecone project ID is required'),
  openaiApiKey: z.string().min(1, 'OpenAI API key is required for embeddings'),
});

// Export type for use in the component props
export type ApiFormValues = z.infer<typeof formSchema>;

const ApiKeysForm: React.FC = () => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState({
    github: false,
    pinecone: false,
    openai: false,
  });

  const form = useForm<ApiFormValues>({
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
      githubService.setApiKey();
      setIsConfigured(prev => ({ ...prev, github: true }));
    }

    if (savedPineconeKey && savedPineconeEnv && savedPineconeIndex) {
      form.setValue('pineconeApiKey', savedPineconeKey);
      form.setValue('pineconeEnvironment', savedPineconeEnv);
      form.setValue('pineconeIndex', savedPineconeIndex);
      form.setValue('pineconeProjectId', savedPineconeProjectId);
      
      setIsConfigured(prev => ({ ...prev, pinecone: true }));
    }
    
    if (savedOpenaiApiKey) {
      form.setValue('openaiApiKey', savedOpenaiApiKey);
      setIsConfigured(prev => ({ ...prev, openai: true }));
    }
  }, [form]);

  const onSubmit = async (values: ApiFormValues) => {
    try {
      // Save GitHub API key
      localStorage.setItem('anarepo_github_api_key', values.githubApiKey);
      githubService.setApiKey();
      setIsConfigured(prev => ({ ...prev, github: true }));

      // Test GitHub API connection
      const testRepo = await githubService.getRepoData();
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
          <GithubApiSection 
            form={form} 
            isConfigured={isConfigured.github} 
          />
          
          <Separator className="my-4" />
          
          <OpenAiSection 
            form={form} 
            isConfigured={isConfigured.openai} 
          />
          
          <Separator className="my-4" />
          
          <PineconeSection 
            form={form} 
            isConfigured={isConfigured.pinecone} 
          />
          
          <Button type="submit" className="w-full mt-6">
            Save API Keys
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default ApiKeysForm;
