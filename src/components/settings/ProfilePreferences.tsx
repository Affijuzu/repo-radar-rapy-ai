
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import pineconeService from '@/services/pinecone';
import { MultiSelect } from './MultiSelect';

const languages = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'C#', value: 'csharp' },
  { label: 'C++', value: 'cpp' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
];

const frameworks = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Next.js', value: 'nextjs' },
  { label: 'Express', value: 'express' },
  { label: 'Django', value: 'django' },
  { label: 'Flask', value: 'flask' },
  { label: 'Spring', value: 'spring' },
  { label: 'Laravel', value: 'laravel' },
];

const ProfilePreferences: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [prioritizeDocs, setPrioritizeDocs] = useState(false);
  const [prioritizeActivity, setPrioritizeActivity] = useState(false);
  const [prioritizeCommunity, setPrioritizeCommunity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (user && pineconeService.isConfigured()) {
        setIsLoading(true);
        try {
          const memory = await pineconeService.retrieveMemory(user);
          if (memory && memory.userPreferences) {
            setSelectedLanguages(memory.userPreferences.preferredLanguages || []);
            setSelectedFrameworks(memory.userPreferences.frameworks || []);
            setPrioritizeDocs(memory.userPreferences.evaluationCriteria?.prioritizeDocs || false);
            setPrioritizeActivity(memory.userPreferences.evaluationCriteria?.prioritizeActivity || false);
            setPrioritizeCommunity(memory.userPreferences.evaluationCriteria?.prioritizeCommunity || false);
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !pineconeService.isConfigured()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please configure your Pinecone API keys first.',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await pineconeService.updateUserPreferences(user, {
        preferredLanguages: selectedLanguages,
        frameworks: selectedFrameworks,
        evaluationCriteria: {
          prioritizeDocs,
          prioritizeActivity,
          prioritizeCommunity,
        },
      });
      
      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save preferences.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Evaluation Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Preferred Programming Languages</Label>
            <MultiSelect
              options={languages}
              selected={selectedLanguages}
              onChange={setSelectedLanguages}
              placeholder="Select languages..."
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              These languages will be prioritized in recommendations
            </p>
          </div>
          
          <div>
            <Label>Preferred Frameworks</Label>
            <MultiSelect
              options={frameworks}
              selected={selectedFrameworks}
              onChange={setSelectedFrameworks}
              placeholder="Select frameworks..."
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              These frameworks will be prioritized in recommendations
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-base">Evaluation Criteria</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prioritizeDocs" 
                checked={prioritizeDocs} 
                onCheckedChange={(checked) => setPrioritizeDocs(checked === true)}
              />
              <Label htmlFor="prioritizeDocs" className="font-normal">
                Prioritize Documentation Quality
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prioritizeActivity" 
                checked={prioritizeActivity}
                onCheckedChange={(checked) => setPrioritizeActivity(checked === true)}
              />
              <Label htmlFor="prioritizeActivity" className="font-normal">
                Prioritize Project Activity
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prioritizeCommunity" 
                checked={prioritizeCommunity}
                onCheckedChange={(checked) => setPrioritizeCommunity(checked === true)}
              />
              <Label htmlFor="prioritizeCommunity" className="font-normal">
                Prioritize Community Support
              </Label>
            </div>
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </form>
    </div>
  );
};

export default ProfilePreferences;
