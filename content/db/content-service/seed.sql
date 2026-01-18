-- Sample data for demonstration

-- Sample events
INSERT INTO events (id, title, date, location, description, category) VALUES
  ('evt-001', 'Home Football Game vs Lincoln', '2025-11-15T19:00:00Z', 'Roosevelt Stadium', 'Cheer squad performs at halftime', 'game'),
  ('evt-002', 'Fall Musical: The Music Man', '2025-11-20T19:30:00Z', 'Roosevelt Auditorium', 'Opening night of our fall production', 'performance'),
  ('evt-003', 'Cheerleading Competition', '2025-12-05T10:00:00Z', 'State Arena', 'Regional competition - wish us luck!', 'competition'),
  ('evt-004', 'Winter Concert', '2025-12-15T18:00:00Z', 'Roosevelt Auditorium', 'Holiday performances by all performing arts groups', 'performance');

-- Sample news articles
INSERT INTO news (id, title, slug, content, excerpt, published_at) VALUES
  (
    'news-001',
    'Cheer Squad Takes First Place at Regional Competition',
    'regional-competition-victory',
    'Our varsity cheer squad brought home the first-place trophy from the Pacific Northwest Regional Competition last weekend. The team performed flawlessly, executing complex stunts and maintaining high energy throughout their routine.

Coach Martinez praised the team''s dedication: "These athletes have been training 6 days a week since August. This victory is a testament to their hard work and team spirit."

Congratulations to all team members!',
    'Roosevelt cheer squad wins first place at regionals with a flawless performance.',
    unixepoch('2025-11-01T10:00:00Z')
  ),
  (
    'news-002',
    'Fall Musical Tickets On Sale Now',
    'fall-musical-tickets',
    'Tickets for our production of "The Music Man" are now available! Shows run November 20-23 at 7:30 PM, with a matinee on Sunday at 2:00 PM.

Ticket prices:
- Students: $8
- Adults: $12
- Seniors: $10

Purchase tickets online or at the door (subject to availability).

Don''t miss this classic American musical brought to life by our talented theater students!',
    'Get your tickets now for The Music Man, opening November 20th.',
    unixepoch('2025-10-28T14:00:00Z')
  ),
  (
    'news-003',
    'Welcome to Roosevelt Performing Arts',
    'welcome',
    'Welcome to the home of Roosevelt High School''s performing arts programs!

This site features news, schedules, and information about our award-winning cheer squad and theater program. Check back regularly for updates on upcoming events, performances, and achievements.

Follow us on social media for behind-the-scenes content and real-time updates during events.

Go Roughriders!',
    'Your source for all things Roosevelt performing arts.',
    unixepoch('2025-10-15T09:00:00Z')
  );

-- Sample roster (cheerleaders example)
INSERT INTO roster (id, name, role, grade, bio, photo_url, sort_order) VALUES
  ('roster-001', 'Sarah Chen', 'Captain', '12', 'Senior captain with 4 years on varsity. Specializes in tumbling and choreography.', '/api/images/cheer-sarah.jpg', 1),
  ('roster-002', 'Marcus Johnson', 'Co-Captain', '12', 'Co-captain and base for pyramid formations. Three-year varsity member.', '/api/images/cheer-marcus.jpg', 2),
  ('roster-003', 'Emma Rodriguez', 'Flyer', '11', 'Junior flyer known for flexibility and precision in aerial stunts.', '/api/images/cheer-emma.jpg', 3),
  ('roster-004', 'Tyler Kim', 'Base', '10', 'Sophomore base with exceptional strength and reliability.', '/api/images/cheer-tyler.jpg', 4),
  ('roster-005', 'Aisha Patel', 'Tumbler', '11', 'Junior tumbler with competitive gymnastics background.', '/api/images/cheer-aisha.jpg', 5);

-- Sample pages
INSERT INTO pages (id, slug, title, content) VALUES
  (
    'page-about',
    'about',
    'About Our Program',
    'Roosevelt High School has a rich tradition of excellence in performing arts.

Our cheer squad has won multiple regional and state championships, and our theater program has been recognized for outstanding productions at the state level.

We are committed to developing well-rounded student athletes and performers who excel both on the field/stage and in the classroom.

**Mission Statement:**
To provide opportunities for students to develop leadership, teamwork, and artistic skills while representing Roosevelt High School with pride and excellence.

**Coaching Staff:**
- Cheer: Coach Sarah Martinez
- Theater: Director James Thompson
- Assistant Director: Ms. Rebecca Liu'
  ),
  (
    'page-booster',
    'booster-club',
    'Booster Club',
    'Support Roosevelt Performing Arts!

The Roosevelt Performing Arts Booster Club supports our students through fundraising, volunteer work, and community engagement.

**How to Help:**
- Attend our events
- Volunteer at competitions and performances
- Make a tax-deductible donation
- Join our email list for updates

**Contact:**
Email: boosters@rooseveltperformingarts.org

All donations directly support student activities, equipment, travel, and scholarships.'
  );
