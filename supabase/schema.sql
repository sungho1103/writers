-- Book Publishing Web App Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. book_submissions
create table if not exists book_submissions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  author_name text not null,
  email text not null,
  phone text not null,
  request_types text[] not null default '{}',
  description text not null,
  requirements text,
  status text not null default 'received',
  estimated_price integer,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. book_submission_files
create table if not exists book_submission_files (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references book_submissions(id) on delete cascade,
  file_type text not null check (file_type in ('original', 'pdf', 'reference')),
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  firebase_path text not null,
  download_url text not null,
  created_at timestamptz not null default now()
);

-- 3. book_ai_analysis
create table if not exists book_ai_analysis (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references book_submissions(id) on delete cascade,
  summary text not null default '',
  structure_analysis text not null default '',
  correction_points text not null default '',
  style_analysis text not null default '',
  workload_estimate text not null default '',
  direction_suggestion text not null default '',
  risk_notes text not null default '',
  created_at timestamptz not null default now()
);

-- Auto-update updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger book_submissions_updated_at
  before update on book_submissions
  for each row execute function update_updated_at();

-- Indexes
create index if not exists idx_book_submissions_status on book_submissions(status);
create index if not exists idx_book_submissions_created_at on book_submissions(created_at desc);
create index if not exists idx_book_submission_files_submission_id on book_submission_files(submission_id);
create index if not exists idx_book_ai_analysis_submission_id on book_ai_analysis(submission_id);

-- RLS Policies
alter table book_submissions enable row level security;
alter table book_submission_files enable row level security;
alter table book_ai_analysis enable row level security;

-- Allow insert from anon (public submission form)
create policy "Allow public insert" on book_submissions
  for insert to anon with check (true);

-- Allow service role full access
create policy "Service role full access submissions" on book_submissions
  for all to service_role using (true) with check (true);

create policy "Service role full access files" on book_submission_files
  for all to service_role using (true) with check (true);

create policy "Service role full access analysis" on book_ai_analysis
  for all to service_role using (true) with check (true);

-- Allow anon insert for files (needed during upload flow)
create policy "Allow public insert files" on book_submission_files
  for insert to anon with check (true);
