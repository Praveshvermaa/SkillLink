-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  phone text,
  avatar_url text,
  role text check (role in ('user', 'provider', 'admin')) default 'user',
  bio text,
  location_lat float,
  location_lng float,
  address text,
  created_at timestamptz default now()
);

-- Skills table
create table skills (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  category text not null,
  description text,
  price numeric not null,
  experience text,
  lat float,
  lng float,
  address text,
  images text[],
  created_at timestamptz default now()
);

-- Bookings table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  provider_id uuid references profiles(id) on delete cascade not null,
  skill_id uuid references skills(id) on delete cascade not null,
  date timestamptz not null,
  status text check (status in ('pending', 'approved', 'completed', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

-- Chats table (to group messages)
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  provider_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, provider_id)
);

-- Messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Reviews table
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table skills enable row level security;
alter table bookings enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

-- Basic Policies (Open for now, refine later)
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Skills are viewable by everyone" on skills for select using (true);
create policy "Providers can insert skills" on skills for insert with check (auth.uid() = provider_id);
create policy "Providers can update own skills" on skills for update using (auth.uid() = provider_id);
create policy "Providers can delete own skills" on skills for delete using (auth.uid() = provider_id);

-- Bookings policies
create policy "Users can view their own bookings" on bookings for select using (auth.uid() = user_id or auth.uid() = provider_id);
create policy "Users can create bookings" on bookings for insert with check (auth.uid() = user_id);
create policy "Providers can update booking status" on bookings for update using (auth.uid() = provider_id);

-- Chat policies
create policy "Users can view their chats" on chats for select using (auth.uid() = user_id or auth.uid() = provider_id);
create policy "Users and providers can create chats" on chats for insert with check (auth.uid() = user_id or auth.uid() = provider_id);

-- Message policies
create policy "Users can view messages in their chats" on messages for select using (
  exists (
    select 1 from chats
    where chats.id = messages.chat_id
    and (chats.user_id = auth.uid() or chats.provider_id = auth.uid())
  )
);
create policy "Users can insert messages in their chats" on messages for insert with check (
  exists (
    select 1 from chats
    where chats.id = chat_id
    and (chats.user_id = auth.uid() or chats.provider_id = auth.uid())
  )
);

-- Review policies
create policy "Reviews are viewable by everyone" on reviews for select using (true);

create policy "Users can create reviews for their bookings" on reviews for insert with check (
  auth.uid() = (select user_id from bookings where id = booking_id)
);
