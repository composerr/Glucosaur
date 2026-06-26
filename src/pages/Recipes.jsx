const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { Camera, Loader2, ChefHat, Clock, Flame, Wheat, ChevronDown, ChevronUp, Star, Search } from "lucide-react";
import MascotHint from "@/components/MascotHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

const DIABETIC_RECIPES = [
  { id: 1, name_uk: "Салат з авокадо та куркою", name_en: "Avocado Chicken Salad", time: 15, cal: 320, carbs: 12, gi: "low", ings_uk: ["Куряче філе 150г", "Авокадо 1шт", "Помідори чері 100г", "Листя салату", "Оливкова олія", "Лимонний сік"], ings_en: ["Chicken breast 150g", "Avocado 1", "Cherry tomatoes 100g", "Lettuce", "Olive oil", "Lemon juice"], steps_uk: ["Наріжте курку кубиками та обсмажте", "Поріжте авокадо та помідори", "Змішайте все, заправте олією та лимонним соком"], steps_en: ["Dice chicken and pan-fry", "Slice avocado and tomatoes", "Mix everything, dress with oil and lemon juice"], tip_uk: "Авокадо містить корисні жири, що уповільнюють засвоєння вуглеводів.", tip_en: "Avocado has healthy fats that slow carb absorption.", ings_list: ["chicken", "avocado", "tomatoes", "salad", "oil", "lemon"], image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80" },
  { id: 2, name_uk: "Суфле з броколі та яєць", name_en: "Broccoli Egg Soufflé", time: 25, cal: 210, carbs: 8, gi: "low", ings_uk: ["Броколі 200г", "Яйця 3шт", "Молоко 50мл", "Сир твердий 30г", "Сіль, перець"], ings_en: ["Broccoli 200g", "Eggs 3", "Milk 50ml", "Hard cheese 30g", "Salt, pepper"], steps_uk: ["Відваріть броколі 5 хв", "Збийте яйця з молоком", "Викладіть броколі у форму, залийте яйцями, посипте сиром", "Запікайте 15 хв при 180°C"], steps_en: ["Boil broccoli 5 min", "Whisk eggs with milk", "Place broccoli in dish, pour eggs, top with cheese", "Bake 15 min at 180°C"], tip_uk: "Броколі має ГІ 10 — ідеальний овоч для діабетиків.", tip_en: "Broccoli has GI 10 — perfect vegetable for diabetics.", ings_list: ["broccoli", "eggs", "milk", "cheese"], image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80" },
  { id: 3, name_uk: "Гречка з грибами", name_en: "Buckwheat with Mushrooms", time: 30, cal: 280, carbs: 35, gi: "low", ings_uk: ["Гречка 100г", "Печериці 200г", "Цибуля 1шт", "Оливкова олія", "Зелень"], ings_en: ["Buckwheat 100g", "Mushrooms 200g", "Onion 1", "Olive oil", "Herbs"], steps_uk: ["Відваріть гречку", "Обсмажте цибулю з грибами", "Змішайте, додайте зелень"], steps_en: ["Cook buckwheat", "Sauté onion with mushrooms", "Mix, add herbs"], tip_uk: "Гречка має низький ГІ (45) і багата на клітковину.", tip_en: "Buckwheat has low GI (45) and is rich in fiber.", ings_list: ["buckwheat", "mushrooms", "onion", "oil", "herbs"], image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&auto=format&fit=crop&q=80" },
  { id: 4, name_uk: "Риба запечена з овочами", name_en: "Baked Fish with Vegetables", time: 35, cal: 290, carbs: 14, gi: "low", ings_uk: ["Філе тріски 200г", "Кабачок 1шт", "Перець болгарський 1шт", "Лимон", "Спеції"], ings_en: ["Cod fillet 200g", "Zucchini 1", "Bell pepper 1", "Lemon", "Spices"], steps_uk: ["Наріжте овочі", "Викладіть рибу та овочі на деко", "Збризніть лимоном, додайте спеції", "Запікайте 25 хв при 180°C"], steps_en: ["Slice vegetables", "Place fish and veggies on tray", "Drizzle lemon, add spices", "Bake 25 min at 180°C"], tip_uk: "Риба не містить вуглеводів — чудовий вибір.", tip_en: "Fish has zero carbs — excellent choice.", ings_list: ["fish", "zucchini", "pepper", "lemon", "spices"], image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80" },
  { id: 5, name_uk: "Чечевичний суп", name_en: "Lentil Soup", time: 40, cal: 250, carbs: 32, gi: "low", ings_uk: ["Червона сочевиця 150г", "Морква 1шт", "Цибуля 1шт", "Часник 2 зуб.", "Томатна паста 1 ст.л.", "Спеції"], ings_en: ["Red lentils 150g", "Carrot 1", "Onion 1", "Garlic 2 cloves", "Tomato paste 1 tbsp", "Spices"], steps_uk: ["Обсмажте цибулю, моркву, часник", "Додайте сочевицю та воду", "Варіть 25 хв", "Додайте томатну пасту та спеції"], steps_en: ["Sauté onion, carrot, garlic", "Add lentils and water", "Boil 25 min", "Add tomato paste and spices"], tip_uk: "Сочевиця (ГІ 32) — відмінне джерело білка та клітковини.", tip_en: "Lentils (GI 32) — great source of protein and fiber.", ings_list: ["lentils", "carrot", "onion", "garlic", "tomato paste", "spices"], image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80" },
  { id: 6, name_uk: "Омлет зі шпинатом", name_en: "Spinach Omelette", time: 10, cal: 190, carbs: 4, gi: "low", ings_uk: ["Яйця 3шт", "Шпинат свіжий 100г", "Помідор 1шт", "Сіль, перець"], ings_en: ["Eggs 3", "Fresh spinach 100g", "Tomato 1", "Salt, pepper"], steps_uk: ["Збийте яйця", "Обсмажте шпинат 2 хв", "Залийте яйцями, додайте помідор", "Готуйте під кришкою 5 хв"], steps_en: ["Whisk eggs", "Sauté spinach 2 min", "Pour eggs, add tomato", "Cook covered 5 min"], tip_uk: "Шпинат практично не містить вуглеводів.", tip_en: "Spinach has almost zero carbs.", ings_list: ["eggs", "spinach", "tomato"], image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80" },
  { id: 7, name_uk: "Котлети з індички на пару", name_en: "Steamed Turkey Patties", time: 30, cal: 230, carbs: 6, gi: "low", ings_uk: ["Фарш з індички 300г", "Цибуля 1шт", "Яйце 1шт", "Кабачок тертий 100г", "Сіль, перець"], ings_en: ["Ground turkey 300g", "Onion 1", "Egg 1", "Grated zucchini 100g", "Salt, pepper"], steps_uk: ["Змішайте всі інгредієнти", "Сформуйте котлети", "Готуйте на пару 20 хв"], steps_en: ["Mix all ingredients", "Form patties", "Steam 20 min"], tip_uk: "Індичка — нежирне м'ясо без вуглеводів.", tip_en: "Turkey is lean meat with zero carbs.", ings_list: ["turkey", "onion", "egg", "zucchini"], image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80" },
  { id: 8, name_uk: "Сирники без борошна", name_en: "Flourless Cheese Pancakes", time: 20, cal: 220, carbs: 10, gi: "low", ings_uk: ["Кисломолочний сир 250г", "Яйце 1шт", "Ваніль", "Кориця", "Олія для смаження"], ings_en: ["Cottage cheese 250g", "Egg 1", "Vanilla", "Cinnamon", "Oil for frying"], steps_uk: ["Змішайте сир з яйцем, ваніллю, корицею", "Сформуйте сирники", "Обсмажте на середньому вогні по 3 хв з кожного боку"], steps_en: ["Mix cheese with egg, vanilla, cinnamon", "Form pancakes", "Fry on medium heat 3 min per side"], tip_uk: "Кориця допомагає знижувати рівень цукру.", tip_en: "Cinnamon helps lower blood sugar.", ings_list: ["cheese", "egg", "vanilla", "cinnamon"], image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80" },
  { id: 9, name_uk: "Салат з нутом та тунцем", name_en: "Chickpea Tuna Salad", time: 10, cal: 310, carbs: 22, gi: "low", ings_uk: ["Нут консервований 200г", "Тунець 150г", "Огірок 1шт", "Помідор 1шт", "Оливкова олія"], ings_en: ["Canned chickpeas 200g", "Tuna 150g", "Cucumber 1", "Tomato 1", "Olive oil"], steps_uk: ["Промийте нут", "Наріжте огірок та помідор", "Змішайте з тунцем, заправте олією"], steps_en: ["Rinse chickpeas", "Dice cucumber and tomato", "Mix with tuna, dress with oil"], tip_uk: "Нут має ГІ 28 — чудове джерело повільних вуглеводів.", tip_en: "Chickpeas have GI 28 — great source of slow carbs.", ings_list: ["chickpeas", "tuna", "cucumber", "tomato", "oil"], image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&auto=format&fit=crop&q=80" },
  { id: 10, name_uk: "Запечене яблуко з горіхами", name_en: "Baked Apple with Nuts", time: 20, cal: 160, carbs: 24, gi: "low", ings_uk: ["Яблуко 2шт", "Волоські горіхи 30г", "Кориця", "Ваніль"], ings_en: ["Apples 2", "Walnuts 30g", "Cinnamon", "Vanilla"], steps_uk: ["Виріжте серцевину яблук", "Наповніть горіхами та корицею", "Запікайте 15 хв при 180°C"], steps_en: ["Core apples", "Fill with nuts and cinnamon", "Bake 15 min at 180°C"], tip_uk: "Запечені яблука мають нижчий ГІ ніж свіжі.", tip_en: "Baked apples have lower GI than fresh ones.", ings_list: ["apple", "walnuts", "cinnamon"], image: "https://images.unsplash.com/photo-1613524942918-a616238b9354?w=600&auto=format&fit=crop&q=80" },
  { id: 11, name_uk: "Кіноа з овочами", name_en: "Quinoa with Vegetables", time: 25, cal: 270, carbs: 34, gi: "low", ings_uk: ["Кіноа 100г", "Перець 1шт", "Цукіні 1шт", "Кукурудза 50г", "Оливкова олія"], ings_en: ["Quinoa 100g", "Bell pepper 1", "Zucchini 1", "Corn 50g", "Olive oil"], steps_uk: ["Відваріть кіноа 15 хв", "Обсмажте нарізані овочі", "Змішайте, додайте олію"], steps_en: ["Cook quinoa 15 min", "Sauté diced vegetables", "Mix, add oil"], tip_uk: "Кіноа — повноцінний білок з низьким ГІ.", tip_en: "Quinoa is complete protein with low GI.", ings_list: ["quinoa", "pepper", "zucchini", "corn", "oil"], image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=80" },
  { id: 12, name_uk: "Курячий суп з цвітною капустою", name_en: "Chicken Cauliflower Soup", time: 35, cal: 200, carbs: 10, gi: "low", ings_uk: ["Куряча грудка 200г", "Цвітна капуста 200г", "Морква 1шт", "Цибуля 1шт", "Зелень"], ings_en: ["Chicken breast 200g", "Cauliflower 200g", "Carrot 1", "Onion 1", "Herbs"], steps_uk: ["Відваріть курку 20 хв", "Додайте нарізані овочі", "Варіть ще 10 хв", "Додайте зелень"], steps_en: ["Boil chicken 20 min", "Add sliced vegetables", "Cook 10 more min", "Add herbs"], tip_uk: "Цвітна капуста — низьковуглеводна альтернатива картоплі.", tip_en: "Cauliflower is low-carb alternative to potatoes.", ings_list: ["chicken", "cauliflower", "carrot", "onion", "herbs"], image: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&auto=format&fit=crop&q=80" },
  { id: 13, name_uk: "Смузі з ягодами", name_en: "Berry Smoothie", time: 5, cal: 140, carbs: 18, gi: "low", ings_uk: ["Заморожені ягоди 100г", "Йогурт натуральний 150г", "Лляне насіння 1 ст.л.", "Вода"], ings_en: ["Frozen berries 100g", "Plain yogurt 150g", "Flaxseed 1 tbsp", "Water"], steps_uk: ["Змішайте всі інгредієнти в блендері", "Додайте воду до бажаної консистенції"], steps_en: ["Blend all ingredients", "Add water to desired consistency"], tip_uk: "Лляне насіння додає клітковину і сповільнює засвоєння цукру.", tip_en: "Flaxseed adds fiber and slows sugar absorption.", ings_list: ["berries", "yogurt", "flaxseed"], image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=600&auto=format&fit=crop&q=80" },
  { id: 14, name_uk: "Фарширований перець з індичкою", name_en: "Turkey Stuffed Peppers", time: 40, cal: 260, carbs: 16, gi: "low", ings_uk: ["Перець болгарський 4шт", "Фарш індички 300г", "Цибуля 1шт", "Помідор 1шт", "Сир 30г"], ings_en: ["Bell peppers 4", "Ground turkey 300g", "Onion 1", "Tomato 1", "Cheese 30g"], steps_uk: ["Обсмажте фарш з цибулею", "Наповніть перці", "Запікайте 25 хв при 180°C", "Посипте сиром за 5 хв до готовності"], steps_en: ["Sauté turkey with onion", "Stuff peppers", "Bake 25 min at 180°C", "Top with cheese 5 min before done"], tip_uk: "Болгарський перець містить вітамін C і має низький ГІ.", tip_en: "Bell peppers are rich in vitamin C with low GI.", ings_list: ["pepper", "turkey", "onion", "tomato", "cheese"], image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80" },
  { id: 15, name_uk: "Хумус домашній", name_en: "Homemade Hummus", time: 10, cal: 180, carbs: 18, gi: "low", ings_uk: ["Нут консервований 200г", "Тахіні 2 ст.л.", "Лимонний сік", "Часник 1 зуб.", "Оливкова олія"], ings_en: ["Canned chickpeas 200g", "Tahini 2 tbsp", "Lemon juice", "Garlic 1 clove", "Olive oil"], steps_uk: ["Збийте всі інгредієнти в блендері", "Додайте воду до кремової консистенції", "Подавайте з овочевими паличками"], steps_en: ["Blend all ingredients", "Add water until creamy", "Serve with veggie sticks"], tip_uk: "Хумус — чудовий перекус з низьким ГІ завдяки нуту.", tip_en: "Hummus is a great low-GI snack thanks to chickpeas.", ings_list: ["chickpeas", "tahini", "lemon", "garlic", "oil"], image: "https://images.unsplash.com/photo-1577906096429-f73ae1831244?w=600&auto=format&fit=crop&q=80" },
  { id: 16, name_uk: "Ягідна запіканка", name_en: "Berry Casserole", time: 30, cal: 190, carbs: 15, gi: "low", ings_uk: ["Кисломолочний сир 200г", "Яйця 2шт", "Ягоди 100г", "Ваніль", "Кориця"], ings_en: ["Cottage cheese 200g", "Eggs 2", "Berries 100g", "Vanilla", "Cinnamon"], steps_uk: ["Змішайте сир, яйця, ваніль", "Додайте ягоди", "Запікайте 20 хв при 180°C"], steps_en: ["Mix cheese, eggs, vanilla", "Add berries", "Bake 20 min at 180°C"], tip_uk: "Запіканка без борошна та цукру — ідеальний діабетичний десерт.", tip_en: "Flourless, sugar-free casserole — perfect diabetic dessert.", ings_list: ["cheese", "eggs", "berries", "vanilla"], image: "https://images.unsplash.com/photo-1464305795204-6f5bdf7af244?w=600&auto=format&fit=crop&q=80" },
  { id: 17, name_uk: "Тушкована капуста з м'ясом", name_en: "Braised Cabbage with Meat", time: 40, cal: 240, carbs: 14, gi: "low", ings_uk: ["Капуста білокачанна 300г", "Яловичина 200г", "Морква 1шт", "Цибуля 1шт", "Томатна паста 1 ст.л."], ings_en: ["White cabbage 300g", "Beef 200g", "Carrot 1", "Onion 1", "Tomato paste 1 tbsp"], steps_uk: ["Обсмажте м'ясо шматочками", "Додайте цибулю та моркву", "Додайте капусту та томатну пасту", "Тушкуйте 30 хв"], steps_en: ["Brown beef pieces", "Add onion and carrot", "Add cabbage and tomato paste", "Braise 30 min"], tip_uk: "Капуста має ГІ 10 і багата на вітамін K.", tip_en: "Cabbage has GI 10 and is rich in vitamin K.", ings_list: ["cabbage", "beef", "carrot", "onion", "tomato paste"], image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=600&auto=format&fit=crop&q=80" },
  { id: 18, name_uk: "Овочеве рагу", name_en: "Vegetable Stew", time: 30, cal: 180, carbs: 22, gi: "low", ings_uk: ["Кабачок 1шт", "Баклажан 1шт", "Перець 1шт", "Помідори 2шт", "Цибуля 1шт", "Часник", "Оливкова олія"], ings_en: ["Zucchini 1", "Eggplant 1", "Pepper 1", "Tomatoes 2", "Onion 1", "Garlic", "Olive oil"], steps_uk: ["Наріжте всі овочі кубиками", "Обсмажте цибулю, часник", "Додайте решту овочів", "Тушкуйте 20 хв"], steps_en: ["Dice all vegetables", "Sauté onion, garlic", "Add remaining vegetables", "Braise 20 min"], tip_uk: "Овочеве рагу — низькокалорійна страва, багата на клітковину.", tip_en: "Vegetable stew is low-calorie, high-fiber.", ings_list: ["zucchini", "eggplant", "pepper", "tomatoes", "onion", "garlic"], image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80" },
  { id: 19, name_uk: "Тефтелі з курячого фаршу", name_en: "Chicken Meatballs", time: 30, cal: 250, carbs: 8, gi: "low", ings_uk: ["Курячий фарш 300г", "Цибуля 1шт", "Яйце 1шт", "Вівсяне борошно 2 ст.л.", "Спеції"], ings_en: ["Ground chicken 300g", "Onion 1", "Egg 1", "Oat flour 2 tbsp", "Spices"], steps_uk: ["Змішайте всі інгредієнти", "Сформуйте тефтелі", "Тушкуйте в томатному соусі 20 хв"], steps_en: ["Mix all ingredients", "Form meatballs", "Braise in tomato sauce 20 min"], tip_uk: "Замініть панірувальні сухарі на вівсяне борошно для нижчого ГІ.", tip_en: "Replace breadcrumbs with oat flour for lower GI.", ings_list: ["chicken", "onion", "egg", "oat flour"], image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80" },
  { id: 20, name_uk: "Млинці з вівсяного борошна", name_en: "Oat Flour Pancakes", time: 15, cal: 200, carbs: 24, gi: "low", ings_uk: ["Вівсяне борошно 100г", "Яйце 1шт", "Молоко 100мл", "Ваніль", "Кориця", "Олія"], ings_en: ["Oat flour 100g", "Egg 1", "Milk 100ml", "Vanilla", "Cinnamon", "Oil"], steps_uk: ["Змішайте всі інгредієнти до однорідності", "Смажте на антипригарній сковороді по 2 хв з кожного боку"], steps_en: ["Mix all ingredients until smooth", "Fry on non-stick pan 2 min per side"], tip_uk: "Вівсяне борошно (ГІ 55) — чудова альтернатива пшеничному.", tip_en: "Oat flour (GI 55) — great alternative to wheat flour.", ings_list: ["oat flour", "egg", "milk"], image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&auto=format&fit=crop&q=80" },
];

export default function Recipes({ settings }) {
  const lang = settings.language;
  const [tab, setTab] = useState("recipes");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [showCount, setShowCount] = useState(10);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem("glucosaur_favs") || "[]"); } catch { return []; } });
  const [ingredientQuery, setIngredientQuery] = useState("");

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("glucosaur_favs", JSON.stringify(next));
  }

  const isUk = lang === "uk";
  let filteredRecipes = DIABETIC_RECIPES;
  if (ingredientQuery.length >= 2) {
    const q = ingredientQuery.toLowerCase();
    filteredRecipes = DIABETIC_RECIPES.filter(r => r.ings_list.some(ing => ing.includes(q)));
  }
  const displayedRecipes = filteredRecipes.slice(0, showCount);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setExpanded({});
  }

  async function analyzeAndGetRecipes() {
    if (!image) return;
    setLoading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file: image });
    const res = await db.integrations.Core.InvokeLLM({
      prompt: isUk
        ? `На фото продукти харчування. Визнач що є і запропонуй 3 рецепти для людей з діабетом 2 типу. Відповідай ЛИШЕ JSON без Markdown. Формат: { "detected_ingredients": ["інгредієнт1"], "recipes": [ { "name": "Назва", "time_minutes": 20, "calories_per_serving": 250, "carbs_grams": 30, "gi_category": "low", "ingredients": ["200г курки"], "steps": ["Крок 1"], "tip": "Порада" } ] }`
        : `Identify food products in this photo and suggest 3 diabetes-friendly recipes. Reply ONLY with JSON, no Markdown. Format: { "detected_ingredients": ["ingredient1"], "recipes": [ { "name": "Name", "time_minutes": 20, "calories_per_serving": 250, "carbs_grams": 30, "gi_category": "low", "ingredients": ["200g chicken"], "steps": ["Step 1"], "tip": "Tip" } ] }`,
      file_urls: [file_url],
      response_json_schema: { type: "object", properties: { detected_ingredients: { type: "array", items: { type: "string" } }, recipes: { type: "array", items: { type: "object", properties: { name: { type: "string" }, time_minutes: { type: "number" }, calories_per_serving: { type: "number" }, carbs_grams: { type: "number" }, gi_category: { type: "string" }, ingredients: { type: "array", items: { type: "string" } }, steps: { type: "array", items: { type: "string" } }, tip: { type: "string" } } } } } }
    });
    setResult(res);
    setLoading(false);
  }

  const giColors = { low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  const giLabels = { low: isUk ? "Низький ГІ" : "Low GI", medium: isUk ? "Середній ГІ" : "Medium GI", high: isUk ? "Високий ГІ" : "High GI" };

  return (
    <div className="space-y-5">
      <MascotHint show={settings.show_mascot !== false} lang={lang} ukText="🦖 Обирай готові рецепти або сфотографуй продукти — я підберу страви для діабетиків! 🍳" enText="🦖 Browse ready recipes or snap your ingredients — I'll suggest diabetes-friendly dishes! 🍳" />
      <h1 className="text-xl font-bold text-foreground">{isUk ? "Рецепти" : "Recipes"}</h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setTab("recipes")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === "recipes" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          🍽 {isUk ? "Рецепти" : "Recipes"}
        </button>
        <button onClick={() => setTab("photo")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === "photo" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          📷 {isUk ? "По фото" : "From Photo"}
        </button>
      </div>

      {/* Recipes tab */}
      {tab === "recipes" && (
        <div className="space-y-4">
          {/* Ingredient search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={ingredientQuery}
              onChange={e => { setIngredientQuery(e.target.value); setShowCount(10); }}
              placeholder={isUk ? "Введіть інгредієнти що є в наявності..." : "Enter ingredients you have..."}
              className="pl-9 rounded-xl"
            />
          </div>

          {displayedRecipes.map((recipe) => {
            const isExpanded = expanded[recipe.id];
            return (
              <div key={recipe.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden flex flex-col">
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={isUk ? recipe.name_uk : recipe.name_en}
                    className="w-full h-44 object-cover border-b border-border/20"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button className="w-full text-left p-4 space-y-3" onClick={() => setExpanded(prev => ({ ...prev, [recipe.id]: !prev[recipe.id] }))}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }} className="p-0.5">
                        <Star className={`w-5 h-5 ${favorites.includes(recipe.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      </button>
                      <span className="text-base font-semibold text-foreground">{isUk ? recipe.name_uk : recipe.name_en}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center"><Clock className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" /><p className="text-sm font-bold text-foreground">{recipe.time}'</p></div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center"><Flame className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" /><p className="text-sm font-bold text-foreground">{recipe.cal}</p></div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center"><Wheat className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" /><p className="text-sm font-bold text-foreground">{recipe.carbs}g</p></div>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${giColors[recipe.gi]}`}>{giLabels[recipe.gi]}</span>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                    <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isUk ? "Інгредієнти" : "Ingredients"}</p>
                      <ul className="space-y-1">{(isUk ? recipe.ings_uk : recipe.ings_en).map((ing, j) => <li key={j} className="flex items-center gap-2 text-sm text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{ing}</li>)}</ul></div>
                    <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isUk ? "Приготування" : "Steps"}</p>
                      <ol className="space-y-2">{(isUk ? recipe.steps_uk : recipe.steps_en).map((step, j) => <li key={j} className="flex items-start gap-3 text-sm text-foreground"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{j + 1}</span>{step}</li>)}</ol></div>
                    {recipe[isUk ? "tip_uk" : "tip_en"] && <div className="bg-primary/5 dark:bg-primary/10 rounded-xl px-3 py-2.5 border border-primary/20"><p className="text-xs font-semibold text-primary mb-0.5">💡 {isUk ? "Порада" : "Tip"}</p><p className="text-xs text-foreground">{recipe[isUk ? "tip_uk" : "tip_en"]}</p></div>}
                  </div>
                )}
              </div>
            );
          })}

          {filteredRecipes.length > showCount && (
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowCount(s => s + 10)}>
              {t("general_show_more", lang)}
            </Button>
          )}
        </div>
      )}

      {/* Photo tab */}
      {tab === "photo" && (
        <>
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{isUk ? "Сфотографуй продукти або вміст холодильника — отримай рецепти, підходящі для діабетиків." : "Take a photo of your ingredients or fridge and get diabetes-friendly recipes."}</p>
            <label className="block cursor-pointer">
              <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 transition-colors hover:border-primary ${imageUrl ? "border-primary/50" : "border-border"}`}>
                {imageUrl ? <img src={imageUrl} alt="" className="max-h-48 rounded-lg object-cover" /> : <><Camera className="w-10 h-10 text-muted-foreground" /><span className="text-sm text-muted-foreground">{isUk ? "Натисни щоб вибрати фото" : "Tap to select a photo"}</span></>}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <Button onClick={analyzeAndGetRecipes} disabled={!image || loading} className="w-full rounded-xl">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isUk ? "Аналізую..." : "Analyzing..."}</> : <><ChefHat className="w-4 h-4 mr-2" />{isUk ? "Отримати рецепти" : "Get Recipes"}</>}
            </Button>
          </div>
          {result && (
            <div className="space-y-4">
              {result.detected_ingredients?.length > 0 && (
                <div className="bg-card rounded-2xl border border-border/50 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isUk ? "Знайдені продукти" : "Detected ingredients"}</p>
                  <div className="flex flex-wrap gap-1.5">{result.detected_ingredients.map((ing, i) => <span key={i} className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium text-foreground">{ing}</span>)}</div>
                </div>
              )}
              {result.recipes?.map((recipe, i) => {
                const isExpanded = expanded[i];
                return (
                  <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                    <button className="w-full text-left p-4 space-y-3" onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}>
                      <div className="flex items-start justify-between gap-2"><span className="text-base font-semibold text-foreground">{recipe.name}</span>{isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}</div>
                      <div className="grid grid-cols-3 gap-2"><div className="bg-muted/50 rounded-xl p-2.5 text-center"><Clock className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" /><p className="text-sm font-bold text-foreground">{recipe.time_minutes}'</p></div><div className="bg-muted/50 rounded-xl p-2.5 text-center"><Flame className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" /><p className="text-sm font-bold text-foreground">{recipe.calories_per_serving}</p></div><div className="bg-muted/50 rounded-xl p-2.5 text-center"><Wheat className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" /><p className="text-sm font-bold text-foreground">{recipe.carbs_grams}г</p></div></div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${giColors[recipe.gi_category] || giColors.medium}`}>{giLabels[recipe.gi_category] || recipe.gi_category}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                        <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isUk ? "Інгредієнти" : "Ingredients"}</p><ul className="space-y-1">{recipe.ingredients?.map((ing, j) => <li key={j} className="flex items-center gap-2 text-sm text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{ing}</li>)}</ul></div>
                        <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isUk ? "Приготування" : "Steps"}</p><ol className="space-y-2">{recipe.steps?.map((step, j) => <li key={j} className="flex items-start gap-3 text-sm text-foreground"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{j + 1}</span>{step}</li>)}</ol></div>
                        {recipe.tip && <div className="bg-primary/5 dark:bg-primary/10 rounded-xl px-3 py-2.5 border border-primary/20"><p className="text-xs font-semibold text-primary mb-0.5">💡 {isUk ? "Порада" : "Tip"}</p><p className="text-xs text-foreground">{recipe.tip}</p></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}