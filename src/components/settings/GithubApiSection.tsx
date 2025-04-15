
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

interface GithubApiSectionProps {
  form: UseFormReturn<ApiFormValues>;
  isConfigured: boolean;
}

const GithubApiSection = ({ form, isConfigured }: GithubApiSectionProps) => {
  return (
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
      <p className="text-sm text-right">
        Status: {isConfigured ? '✅ Configured' : '❌ Not configured'}
      </p>
    </div>
  );
};

export default GithubApiSection;
