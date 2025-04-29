
import { useState, useEffect } from 'react';
import pineconeService from '@/services/pinecone';
import { toast as showToast } from 'sonner';

export const useUserMemory = (user) => {
  const [userMemory, setUserMemory] = useState(null);

  useEffect(() => {
    if (user) {
      const loadMemory = async () => {
        try {
          if (pineconeService.isConfigured()) {
            const memory = await pineconeService.retrieveMemory(user);
            if (memory) {
              console.log("Loaded memory from Pinecone:", memory);
              setUserMemory(memory);
              
              // Show a toast notification if we have previous evaluations
              if (memory.repoEvaluations && memory.repoEvaluations.length > 0) {
                showToast("Memory loaded", {
                  description: `Found ${memory.repoEvaluations.length} previous repository evaluations`,
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to load memory from Pinecone", e);
        }
      };
      
      loadMemory();
    } else {
      setUserMemory(null);
    }
  }, [user]);

  return { userMemory, setUserMemory };
};
