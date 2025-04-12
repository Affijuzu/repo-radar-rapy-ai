
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const About: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gradient">About ANAREPO</h1>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-4">
              ANAREPO was created to solve a common problem faced by developers: 
              how to efficiently evaluate open-source projects for potential use in applications.
              Our mission is to save developers time and help them make more informed decisions about
              the libraries and frameworks they choose to incorporate into their projects.
            </p>
            <p className="text-muted-foreground">
              By combining real-time GitHub data with AI-powered analysis and persistent memory,
              we provide personalized insights that remember your preferences across sessions,
              making the evaluation process faster and more accurate.
            </p>
          </section>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <p className="text-muted-foreground mb-4">
              Our AI assistant, Rapy, uses a combination of technologies to deliver meaningful insights:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Vector Database Storage:</strong> We use Pinecone to store embeddings 
                of your conversations, preferences, and previously evaluated repositories.
              </li>
              <li>
                <strong>Real-time API Integration:</strong> Rapy connects to the GitHub API to fetch
                the latest data about repositories, ensuring you always have current information.
              </li>
              <li>
                <strong>AI-Powered Analysis:</strong> Gemini AI processes the data to generate
                insights about activity levels, community support, and documentation quality.
              </li>
              <li>
                <strong>Persistent Memory:</strong> Your preferences and evaluation history are
                stored securely and retrieved across chat sessions, even after clearing the chat.
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
            <p className="text-muted-foreground mb-4">
              ANAREPO was developed by a team of developers who understand the challenges of
              selecting the right open-source tools for projects. Our combined experience in
              software development, AI, and data analysis has shaped this tool to address real
              pain points in the development workflow.
            </p>
            <p className="text-muted-foreground">
              We're constantly improving Rapy AI based on user feedback and emerging technologies.
              If you have suggestions or questions, we'd love to hear from you!
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
