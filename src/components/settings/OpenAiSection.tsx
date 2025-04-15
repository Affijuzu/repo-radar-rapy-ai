
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

interface OpenAiSectionProps {
  form: UseFormReturn<ApiFormValues>;
  isConfigured: boolean;
}

const OpenAiSection = ({ form, isConfigured }: OpenAiSectionProps) => {
  return (
    <div className="space-y-4">
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
      <p className="text-sm text-right">
        Status: {isConfigured ? '✅ Configured' : '❌ Not configured'}
      </p>
    </div>
  );
};

export default OpenAiSection;
