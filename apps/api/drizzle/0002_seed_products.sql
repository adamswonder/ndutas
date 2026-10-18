-- The starting menu (from @ndutas/core's meals), so a new database has products to sell.
-- Placeholder items and photos: the owner replaces them from the back office.
INSERT INTO "products" ("id", "name", "description", "price", "image", "category", "available", "sort_order") VALUES
  ('french-toast', 'Berry French Toast', 'Brioche, banana, blueberries, maple.', 1150, 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=75', 'breakfast', true, 1),
  ('egg-toast', 'Sunny Egg Toast', 'Sourdough, fried egg, chilli flakes.', 900, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=75', 'breakfast', true, 2),
  ('pancakes', 'Buttermilk Pancakes', 'Blueberries, banana, honey syrup.', 1050, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=75', 'breakfast', true, 3),
  ('full-breakfast', 'Full Breakfast Box', 'Eggs, toast, grilled tomato.', 1450, 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=75', 'breakfast', true, 4),
  ('avocado-eggs', 'Avocado & Eggs', 'Boiled eggs, avocado, greens.', 1300, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=75', 'breakfast', true, 5),
  ('pancake-stack', 'Honey Pancake Stack', 'Six pancakes, honey, fresh herbs.', 1150, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=75', 'breakfast', true, 6),
  ('buddha-bowl', 'Garden Buddha Bowl', 'Chickpeas, avocado, sweet potato.', 1550, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=75', 'lunch', true, 1),
  ('salmon-bowl', 'Salmon Poke Bowl', 'Salmon, egg, cucumber, cabbage.', 1950, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=75', 'lunch', true, 2),
  ('grain-bowl', 'Green Grain Bowl', 'Couscous, green beans, tomatoes.', 1450, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=75', 'lunch', true, 3),
  ('classic-burger', 'Classic Burger & Fries', 'Beef patty, lettuce, crispy fries.', 1700, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=75', 'lunch', true, 4),
  ('cheeseburger', 'Double Cheeseburger', 'Two patties, cheddar, house sauce.', 1800, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=75', 'lunch', true, 5),
  ('pumpkin-soup', 'Pumpkin Soup', 'Roast pumpkin, feta, seeds.', 1050, 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=75', 'lunch', true, 6),
  ('pasta-salad', 'Pesto Pasta Salad', 'Farfalle, pesto, cherry tomatoes.', 1300, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=75', 'lunch', true, 7),
  ('house-salad', 'House Salad', 'Mixed greens, red onion, seeds.', 1150, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=75', 'lunch', true, 8),
  ('seared-salmon', 'Seared Salmon', 'Salmon fillet, vegetable broth.', 2350, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=75', 'dinner', true, 1),
  ('shrimp-spaghetti', 'Shrimp Spaghetti', 'Prawns, tomato, garlic, parsley.', 2100, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=75', 'dinner', true, 2),
  ('curry-trio', 'Curry Trio', 'Three curries with steamed rice.', 2200, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=75', 'dinner', true, 3),
  ('chicken-curry', 'Chicken Curry & Rice', 'Mild chicken curry, basmati.', 1800, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=75', 'dinner', true, 4),
  ('steak-fries', 'Steak & Fries', 'Sliced sirloin, herb fries.', 2450, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=75', 'dinner', true, 5),
  ('bbq-ribs', 'BBQ Ribs', 'Slow-cooked ribs, fresh tomato.', 2350, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=75', 'dinner', true, 6),
  ('mixed-grill', 'Mixed Grill', 'Chicken, beef, roast vegetables.', 2600, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=75', 'dinner', true, 7),
  ('beef-plate', 'Pepper Beef Plate', 'Seared beef, greens, chilli.', 2100, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=75', 'dinner', true, 8)
ON CONFLICT ("id") DO NOTHING;
