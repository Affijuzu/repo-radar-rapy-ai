
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { langchainService } from "./langchainService";

/**
 * Generate response based on user input
 */
export const generateResponse = async (content, user, userMemory) => {
  try {
    console.log("Generating response for:", content);
    
    if (content.toLowerCase().includes('analyze') && content.toLowerCase().includes('github.com')) {
      // Use our service for repository analysis
      return await langchainService.analyzeRepositoryWithLangChain(content, user);
    }
    
    // For other types of queries, use the regular generate-response function
    const { data, error } = await supabase.functions.invoke('generate-response', {
      body: {
        content,
        userId: user?.id,
        userMemory
      }
    });

    if (error) {
      console.error("Error invoking generate-response function:", error);
      toast.error("Failed to generate a response", {
        description: error.message || "Please try again later"
      });
      return "I'm sorry, I encountered an error while processing your request. Please try again later.";
    }

    if (!data || !data.response) {
      console.error("No response data returned");
      return "I'm sorry, I didn't understand that request. Could you please rephrase?";
    }

    // Check if there's an error message indicating invalid repository
    if (data.error) {
      if (data.errorType === "NOT_FOUND") {
        toast.error("Repository not found", {
          description: "The repository doesn't exist or is private"
        });
        return "I couldn't find that repository. Please check that the repository exists, is public, and the owner/repo name is correct.";
      } else {
        toast.error("GitHub API error", {
          description: data.error
        });
        return `I encountered an error while analyzing the repository: ${data.error}`;
      }
    }

    console.log("Response generated successfully");
    return data.response;
  } catch (e) {
    console.error("Failed to generate response:", e);
    toast.error("Failed to generate a response", {
      description: e.message || "Please try again later"
    });
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
};
