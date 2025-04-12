
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowRight, Github, BarChart3, MessageSquare, Stars } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-white dark:from-purple-900/40 dark:to-purple-950/60 z-0"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 text-gradient">
                Your AI Assistant for Open Source Evaluation
              </h1>
              <p className="text-xl mb-8 text-muted-foreground">
                ANAREPO helps developers evaluate GitHub repositories with personalized recommendations
                based on your unique technical requirements and project needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={user ? "/chat" : "/register"}>
                  <Button size="lg" className="group">
                    {user ? "Start Analyzing" : "Get Started for Free"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline">
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10"></div>
        </section>
        
        {/* Problem Statement */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Problem</h2>
              <p className="text-xl text-muted-foreground">
                Developers spend hours researching open-source libraries, often making decisions
                with incomplete information or missing critical factors relevant to their specific needs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="p-6 border rounded-lg flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Time Consuming Research</h3>
                <p className="text-muted-foreground">
                  Hours spent analyzing GitHub stars, issues, and commit frequency without personalized insights.
                </p>
              </div>
              
              <div className="p-6 border rounded-lg flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Memory Loss Between Sessions</h3>
                <p className="text-muted-foreground">
                  Chatbots forget your preferences and previously evaluated repositories when you start a new conversation.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Solution */}
        <section className="py-16 bg-purple-50 dark:bg-purple-950/20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Solution</h2>
              <p className="text-xl text-muted-foreground">
                Rapy AI combines real-time GitHub data with persistent memory to provide 
                personalized repository recommendations that remember your preferences.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-6 border rounded-lg glass-card">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <Github className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Analysis</h3>
                <p className="text-muted-foreground">
                  Get up-to-date metrics on activity levels, community support, and documentation quality.
                </p>
              </div>
              
              <div className="p-6 border rounded-lg glass-card">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <Stars className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Personalized Insights</h3>
                <p className="text-muted-foreground">
                  Recommendations tailored to your specific technical requirements and project needs.
                </p>
              </div>
              
              <div className="p-6 border rounded-lg glass-card">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Memory Across Sessions</h3>
                <p className="text-muted-foreground">
                  Rapy remembers your preferences and previous analyses even after clearing the chat.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Why Rapy */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Rapy AI?</h2>
              <p className="text-xl text-muted-foreground">
                Our AI assistant is specifically designed to help developers make informed decisions about open source libraries.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2 text-purple-600">1</span>
                  Long-term Memory
                </h3>
                <p className="text-muted-foreground mb-6">
                  Rapy remembers your technical requirements and preferences across all conversations,
                  even after clearing chat history.
                </p>
                
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2 text-purple-600">2</span>
                  Comprehensive Analysis
                </h3>
                <p className="text-muted-foreground">
                  Get deep insights into repository activity, community support, documentation quality,
                  and maintenance status with just a simple prompt.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2 text-purple-600">3</span>
                  Comparative Evaluation
                </h3>
                <p className="text-muted-foreground mb-6">
                  Easily compare multiple repositories based on your specific needs and previously
                  evaluated projects.
                </p>
                
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2 text-purple-600">4</span>
                  Time-Saving Insights
                </h3>
                <p className="text-muted-foreground">
                  Reduce research time from hours to minutes with AI-powered analysis that focuses
                  on what matters most to your project.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16 bg-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Start Analyzing Repositories with Rapy AI
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join developers who are making better decisions about open source libraries with personalized AI assistance.
            </p>
            <Link to={user ? "/chat" : "/register"}>
              <Button size="lg" variant="secondary" className="group">
                {user ? "Go to Rapy AI" : "Sign Up for Free"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
