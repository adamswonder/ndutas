import type { Product } from "../domain/product"
import { unsplash } from "./images"

// Placeholder menu and stock photos until the client's real meals are in.
export const meals: Product[] = [
  { id: "french-toast", category: "breakfast", name: "Berry French Toast", description: "Brioche, banana, blueberries, maple.", price: 1150, image: unsplash("1484723091739-30a097e8f929") },
  { id: "egg-toast", category: "breakfast", name: "Sunny Egg Toast", description: "Sourdough, fried egg, chilli flakes.", price: 900, image: unsplash("1525351484163-7529414344d8") },
  { id: "pancakes", category: "breakfast", name: "Buttermilk Pancakes", description: "Blueberries, banana, honey syrup.", price: 1050, image: unsplash("1528207776546-365bb710ee93") },
  { id: "full-breakfast", category: "breakfast", name: "Full Breakfast Box", description: "Eggs, toast, grilled tomato.", price: 1450, image: unsplash("1533089860892-a7c6f0a88666") },
  { id: "avocado-eggs", category: "breakfast", name: "Avocado & Eggs", description: "Boiled eggs, avocado, greens.", price: 1300, image: unsplash("1482049016688-2d3e1b311543") },
  { id: "pancake-stack", category: "breakfast", name: "Honey Pancake Stack", description: "Six pancakes, honey, fresh herbs.", price: 1150, image: unsplash("1567620905732-2d1ec7ab7445") },
  { id: "buddha-bowl", category: "lunch", name: "Garden Buddha Bowl", description: "Chickpeas, avocado, sweet potato.", price: 1550, image: unsplash("1512621776951-a57141f2eefd") },
  { id: "salmon-bowl", category: "lunch", name: "Salmon Poke Bowl", description: "Salmon, egg, cucumber, cabbage.", price: 1950, image: unsplash("1546069901-ba9599a7e63c") },
  { id: "grain-bowl", category: "lunch", name: "Green Grain Bowl", description: "Couscous, green beans, tomatoes.", price: 1450, image: unsplash("1547592180-85f173990554") },
  { id: "classic-burger", category: "lunch", name: "Classic Burger & Fries", description: "Beef patty, lettuce, crispy fries.", price: 1700, image: unsplash("1551782450-a2132b4ba21d") },
  { id: "cheeseburger", category: "lunch", name: "Double Cheeseburger", description: "Two patties, cheddar, house sauce.", price: 1800, image: unsplash("1568901346375-23c9450c58cd") },
  { id: "pumpkin-soup", category: "lunch", name: "Pumpkin Soup", description: "Roast pumpkin, feta, seeds.", price: 1050, image: unsplash("1476718406336-bb5a9690ee2a") },
  { id: "pasta-salad", category: "lunch", name: "Pesto Pasta Salad", description: "Farfalle, pesto, cherry tomatoes.", price: 1300, image: unsplash("1473093295043-cdd812d0e601") },
  { id: "house-salad", category: "lunch", name: "House Salad", description: "Mixed greens, red onion, seeds.", price: 1150, image: unsplash("1540189549336-e6e99c3679fe") },
  { id: "seared-salmon", category: "dinner", name: "Seared Salmon", description: "Salmon fillet, vegetable broth.", price: 2350, image: unsplash("1467003909585-2f8a72700288") },
  { id: "shrimp-spaghetti", category: "dinner", name: "Shrimp Spaghetti", description: "Prawns, tomato, garlic, parsley.", price: 2100, image: unsplash("1563379926898-05f4575a45d8") },
  { id: "curry-trio", category: "dinner", name: "Curry Trio", description: "Three curries with steamed rice.", price: 2200, image: unsplash("1585937421612-70a008356fbe") },
  { id: "chicken-curry", category: "dinner", name: "Chicken Curry & Rice", description: "Mild chicken curry, basmati.", price: 1800, image: unsplash("1588166524941-3bf61a9c41db") },
  { id: "steak-fries", category: "dinner", name: "Steak & Fries", description: "Sliced sirloin, herb fries.", price: 2450, image: unsplash("1600891964092-4316c288032e") },
  { id: "bbq-ribs", category: "dinner", name: "BBQ Ribs", description: "Slow-cooked ribs, fresh tomato.", price: 2350, image: unsplash("1544025162-d76694265947") },
  { id: "mixed-grill", category: "dinner", name: "Mixed Grill", description: "Chicken, beef, roast vegetables.", price: 2600, image: unsplash("1555939594-58d7cb561ad1") },
  { id: "beef-plate", category: "dinner", name: "Pepper Beef Plate", description: "Seared beef, greens, chilli.", price: 2100, image: unsplash("1504674900247-0877df9cc836") },
]
