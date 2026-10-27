-- Tạo bảng lưu trạng thái phòng dùng chung
CREATE TABLE IF NOT EXISTS public.room_states (
  room_code text PRIMARY KEY,
  state_data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE public.room_states ENABLE ROW LEVEL SECURITY;

-- Cho phép người dùng đọc và cập nhật phòng bằng mã phòng (room_code)
CREATE POLICY "Allow public read and write by room_code"
ON public.room_states
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Bật Realtime để các điện thoại tự động đồng bộ khi có người tick việc
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_states;
