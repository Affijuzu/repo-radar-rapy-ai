
# ANAREPO Deployment Guide

This document outlines the steps needed to deploy the ANAREPO application to production.

## Prerequisites

- A Supabase account with a project set up
- A hosting platform (Vercel, Netlify, or similar)
- Git installed on your local machine

## Step 1: Prepare Your Environment Variables

The application requires the following environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These should be set in your hosting platform's environment variables section.

## Step 2: Set Up Supabase

1. Ensure your Supabase project has the correct tables and edge functions:
   - profiles
   - chat_history
   - messages
   - repo_analyses
   - user_settings

2. Verify that the edge functions are deployed:
   - analyze-repo
   - generate-response

3. Set up authentication providers in Supabase:
   - Navigate to Authentication > Providers
   - Enable Email/Password authentication
   - Configure any other authentication providers you need

## Step 3: Deploy to Hosting Platform

### Deploying to Vercel

1. Connect your Git repository to Vercel
2. Configure environment variables in Vercel settings
3. Deploy the application

### Deploying to Netlify

1. Connect your Git repository to Netlify
2. Configure environment variables in Netlify settings
3. Deploy the application

## Step 4: Configure CORS and Authentication Redirects

1. In your Supabase dashboard, go to Settings > API
2. Add your deployed application URL to the allowed origins for CORS
3. Go to Authentication > URL Configuration
4. Set the Site URL to your deployed application URL
5. Add redirect URLs for authentication flow

## Step 5: Verify Deployment

1. Visit your deployed application URL
2. Test user registration and login functionality
3. Test repository analysis functionality
4. Test chat conversation and history functionality

## Troubleshooting

If you encounter issues during deployment:

1. Check browser console for JavaScript errors
2. Verify environment variables are set correctly
3. Check Supabase logs for edge function errors
4. Ensure database tables and policies are set up correctly

## Scaling Considerations

As your application grows:

1. Monitor Supabase usage and upgrade plans as needed
2. Consider implementing caching for frequently accessed repository data
3. Optimize edge functions for performance
