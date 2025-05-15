# Task: Implement Email Integration for GreekDash

## Goal

Enable chapter admins to send emails for invites, approvals, and general chapter notifications using Resend or SendGrid.

## Features

- Admin email invites with unique tokens
- Email notification when pending members are approved
- Optional broadcast email to all chapter members

## Stack

- Resend SDK
- Supabase for storing invite tokens
- Next.js App Router and server actions

## Steps

1. Install Resend:
   ```bash
   npm install resend
