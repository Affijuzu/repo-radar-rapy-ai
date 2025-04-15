
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { ApiFormValues } from './ApiKeysForm';

interface PineconeSectionProps {
  form: UseFormReturn<ApiFormValues>;
  isConfigured: boolean;
}

const PineconeSection = ({ form, isConfigured }: PineconeSectionProps) => {
  return (
    <div className="space-y-4">
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
      <p className="text-sm text-right">
        Status: {isConfigured ? '✅ Configured' : '❌ Not configured'}
      </p>
    </div>
  );
};

export default PineconeSection;
