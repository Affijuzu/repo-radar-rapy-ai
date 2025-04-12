
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Privacy: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gradient">Privacy Policy</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              At ANAREPO, we take your privacy seriously. This Privacy Policy outlines how we collect,
              use, and protect your information when you use our service.
            </p>
            <p className="text-muted-foreground">
              By using ANAREPO, you agree to the collection and use of information in accordance
              with this policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information Collection</h2>
            <p className="text-muted-foreground mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Account Information:</strong> Email address, name, and password when you register.
              </li>
              <li>
                <strong>Chat Data:</strong> Messages you send to Rapy AI, including your queries about repositories.
              </li>
              <li>
                <strong>Preferences:</strong> Information about your technical requirements and repository preferences.
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our service, including features used and time spent.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the collected information for:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-muted-foreground">
              <li>Providing and improving our service</li>
              <li>Personalizing your experience with Rapy AI</li>
              <li>Storing your preferences and conversation history</li>
              <li>Analyzing usage patterns to enhance features</li>
              <li>Communication about service updates or changes</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Storage</h2>
            <p className="text-muted-foreground mb-4">
              We use Pinecone, a vector database, to store embeddings of your conversations and preferences.
              This allows Rapy AI to maintain context and personalized recommendations across chat sessions.
            </p>
            <p className="text-muted-foreground">
              All data is stored securely and we implement appropriate technical measures to protect
              your information from unauthorized access or disclosure.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or otherwise transfer your information to outside parties except
              as necessary to provide our service or as required by law.
            </p>
            <p className="text-muted-foreground">
              We may use third-party service providers to help us operate our service, but they
              will be subject to confidentiality obligations.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-muted-foreground">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your information</li>
              <li>Data portability</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page. You are advised to review this
              Privacy Policy periodically for any changes.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
