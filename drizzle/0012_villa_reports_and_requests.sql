-- Create villa_report table
CREATE TABLE IF NOT EXISTS villa_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id INTEGER NOT NULL REFERENCES villa(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('scam', 'invalid', 'closed', 'other')),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  custom_category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create villa_change_request table
CREATE TABLE IF NOT EXISTS villa_change_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id INTEGER NOT NULL REFERENCES villa(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  request_detail TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_villa_report_villa_id ON villa_report(villa_id);
CREATE INDEX idx_villa_report_user_id ON villa_report(user_id);
CREATE INDEX idx_villa_report_status ON villa_report(status);
CREATE INDEX idx_villa_report_created_at ON villa_report(created_at DESC);

CREATE INDEX idx_villa_change_request_villa_id ON villa_change_request(villa_id);
CREATE INDEX idx_villa_change_request_user_id ON villa_change_request(user_id);
CREATE INDEX idx_villa_change_request_status ON villa_change_request(status);
CREATE INDEX idx_villa_change_request_created_at ON villa_change_request(created_at DESC);