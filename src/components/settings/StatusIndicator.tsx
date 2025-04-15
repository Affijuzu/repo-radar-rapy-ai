
import React from 'react';
import { Separator } from '@/components/ui/separator';

interface StatusIndicatorProps {
  github: boolean;
  openai: boolean;
  pinecone: boolean;
}

const StatusIndicator = ({ github, openai, pinecone }: StatusIndicatorProps) => {
  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="text-lg font-medium mb-2">Configuration Status</h3>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p>GitHub API:</p>
          <p>{github ? '✅ Configured' : '❌ Not configured'}</p>
        </div>
        <div>
          <p>OpenAI:</p>
          <p>{openai ? '✅ Configured' : '❌ Not configured'}</p>
        </div>
        <div>
          <p>Pinecone:</p>
          <p>{pinecone ? '✅ Configured' : '❌ Not configured'}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator;
