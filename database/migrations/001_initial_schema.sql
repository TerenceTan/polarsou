-- Bill Splitting App Database Schema
-- This file contains the initial database schema for the bill splitting application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for registered users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (bill splitting sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organizer_name VARCHAR(255), -- For anonymous organizers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    total_owed DECIMAL(10,2) DEFAULT 0.00,
    total_paid DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill items table
CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_by UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    has_sst BOOLEAN DEFAULT FALSE,
    sst_amount DECIMAL(10,2) DEFAULT 0.00,
    per_person_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill item participants (many-to-many relationship for who shared each item)
CREATE TABLE bill_item_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_item_id UUID NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(bill_item_id, participant_id)
);

-- Payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('qr_code', 'duitnow', 'bank_transfer')),
    display_name VARCHAR(255) NOT NULL,
    qr_code_url TEXT,
    duitnow_id VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    account_holder VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_sessions_organizer_id ON sessions(organizer_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_bill_items_session_id ON bill_items(session_id);
CREATE INDEX idx_bill_items_paid_by ON bill_items(paid_by);
CREATE INDEX idx_bill_item_participants_bill_item_id ON bill_item_participants(bill_item_id);
CREATE INDEX idx_bill_item_participants_participant_id ON bill_item_participants(participant_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_session_id ON payment_methods(session_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_item_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Sessions: Anyone can view, only organizer can modify
CREATE POLICY "Anyone can view sessions" ON sessions
    FOR SELECT USING (TRUE);

CREATE POLICY "Organizers can create sessions" ON sessions
    FOR INSERT WITH CHECK (
        auth.uid() = organizer_id OR organizer_id IS NULL
    );

CREATE POLICY "Organizers can update own sessions" ON sessions
    FOR UPDATE USING (
        auth.uid() = organizer_id OR organizer_id IS NULL
    );

CREATE POLICY "Organizers can delete own sessions" ON sessions
    FOR DELETE USING (
        auth.uid() = organizer_id OR organizer_id IS NULL
    );

-- Participants: Anyone can view, session organizer can modify
CREATE POLICY "Anyone can view participants" ON participants
    FOR SELECT USING (TRUE);

CREATE POLICY "Session organizers can manage participants" ON participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = participants.session_id 
            AND (sessions.organizer_id = auth.uid() OR sessions.organizer_id IS NULL)
        )
    );

-- Bill items: Anyone can view, session organizer can modify
CREATE POLICY "Anyone can view bill items" ON bill_items
    FOR SELECT USING (TRUE);

CREATE POLICY "Session organizers can manage bill items" ON bill_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = bill_items.session_id 
            AND (sessions.organizer_id = auth.uid() OR sessions.organizer_id IS NULL)
        )
    );

-- Bill item participants: Anyone can view, session organizer can modify
CREATE POLICY "Anyone can view bill item participants" ON bill_item_participants
    FOR SELECT USING (TRUE);

CREATE POLICY "Session organizers can manage bill item participants" ON bill_item_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bill_items 
            JOIN sessions ON sessions.id = bill_items.session_id
            WHERE bill_items.id = bill_item_participants.bill_item_id 
            AND (sessions.organizer_id = auth.uid() OR sessions.organizer_id IS NULL)
        )
    );

-- Payment methods: Users can manage their own, session organizers can manage session-specific ones
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = payment_methods.session_id 
            AND (sessions.organizer_id = auth.uid() OR sessions.organizer_id IS NULL)
        )
    );

CREATE POLICY "Users can manage own payment methods" ON payment_methods
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = payment_methods.session_id 
            AND (sessions.organizer_id = auth.uid() OR sessions.organizer_id IS NULL)
        )
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

