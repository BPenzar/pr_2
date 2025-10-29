-- Add rating_scale column to questions table
-- This allows storing the scale preference for rating questions (5 or 10)

ALTER TABLE questions
ADD COLUMN rating_scale INTEGER;

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN questions.rating_scale IS 'Rating scale for rating questions: 5 for 1-5 star rating, 10 for 1-10 numerical scale';

-- Update existing rating questions to use default scale of 5
UPDATE questions
SET rating_scale = 5
WHERE type = 'rating' AND rating_scale IS NULL;