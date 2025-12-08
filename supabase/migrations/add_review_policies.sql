-- Review policies
create policy "Reviews are viewable by everyone" on reviews for select using (true);

create policy "Users can create reviews for their bookings" on reviews for insert with check (
  auth.uid() = (select user_id from bookings where id = booking_id)
);
