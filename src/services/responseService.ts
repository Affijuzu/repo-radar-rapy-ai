
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";
import { toast } from "sonner";

/**
 * Generate response based on user input
 */
export const generateResponse = async (content: string, user: User | null, userMemory: any): Promise<string> => {
  try {
    // Call the generate-response edge function
    const { data, error } = await supabase.functions.invoke('generate-response', {
      body: {
        content,
        userId: user?.id,
        userMemory
      }
    });

    if (error) {
      console.error("Error invoking generate-response function:", error);
      return "I'm sorry, I encountered an error while processing your request. Please try again later.";
    }

    if (data && data.response) {
      return data.response;
    }

    return "I'm sorry, I didn't understand that request. Could you please rephrase?";
  } catch (e) {
    console.error("Failed to generate response:", e);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
};
