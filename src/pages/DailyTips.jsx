import { useState } from "react";
import MascotHint from "@/components/MascotHint";
import { Lightbulb, RefreshCw } from "lucide-react";

const FACTS_UK = [
  "Голлі Беррі впала в діабетичну кому під час зйомок серіалу і після цього повністю змінила спосіб життя.",
  "Том Генкс живе з діабетом 2 типу з 2013 року. Він жартує, що його лікар сказав: «Ти більше не можеш важити як у фільмі „Філадельфія“».",
  "Нік Джонас (Jonas Brothers) дізнався про свій діабет 1 типу у 13 років. Він виступав на сцені того ж вечора після діагнозу.",
  "Інсулін був відкритий у 1921 році канадськими вченими Бантінгом і Бестом. До цього діабет 1 типу був смертельним вироком.",
  "Перша ін'єкція інсуліну людині була зроблена 11 січня 1922 року 14-річному хлопчику Леонарду Томпсону.",
  "Собака на ім'я Марджорі була першою істотою, якій ввели інсулін. Вона прожила з діабетом 70 днів завдяки екстракту підшлункової залози.",
  "У Стародавньому Єгипті (1550 р. до н.е.) лікарі описували хворобу з симптомами «надмірної спраги та сечовипускання» — це перший запис про діабет.",
  "Слово «діабет» походить від грецького «diabainein» — «проходити крізь», через частий сечопуск. «Mellitus» додали пізніше — «солодкий як мед».",
  "Шерон Стоун живе з діабетом з дитинства. Вона активно займається благодійністю для хворих на діабет.",
  "Близько 537 мільйонів дорослих у світі живуть із діабетом (дані 2021 року). Це кожен 10-й дорослий.",
  "Перший портативний глюкометр з'явився у 1970 році. До цього пацієнти визначали рівень цукру за кольором тест-смужки.",
  "Діабет 2 типу становить близько 90% усіх випадків діабету у світі.",
  "У 2016 році FDA схвалило першу «штучну підшлункову залозу» — систему, що автоматично регулює подачу інсуліну.",
  "Фізичні вправи підвищують чутливість до інсуліну на 24–48 годин після тренування.",
  "Тереза Мей, колишня прем'єр-міністр Великої Британії, живе з діабетом 1 типу і носить інсулінову помпу.",
  "У 2022 році вчені вперше успішно вилікували діабет 1 типу у мишей за допомогою стовбурових клітин.",
  "Холлівудська акторка Геллі Беррі стверджує, що їй вдалося «повернути» діабет 2 типу за допомогою кето-дієти.",
  "Діабет був однією з перших хвороб, описаних у медичному папірусі Еберса (1550 р. до н.е.).",
  "Люди з діабетом 1 типу в середньому роблять близько 40 000 ін'єкцій інсуліну за життя.",
  "Найбільша кількість хворих на діабет живе в Китаї — понад 140 мільйонів людей.",
];

const FACTS_EN = [
  "Halle Berry fell into a diabetic coma while filming a TV series and completely transformed her lifestyle afterward.",
  "Tom Hanks has lived with type 2 diabetes since 2013. His doctor joked: 'You can't weigh what you did in Philadelphia anymore.'",
  "Nick Jonas (Jonas Brothers) was diagnosed with type 1 diabetes at 13. He performed on stage the very same evening.",
  "Insulin was discovered in 1921 by Canadian scientists Banting and Best. Before that, type 1 diabetes was a death sentence.",
  "The first insulin injection was given on January 11, 1922 to 14-year-old Leonard Thompson.",
  "A dog named Marjorie was the first living being to receive insulin. She lived 70 days thanks to pancreatic extract.",
  "Ancient Egyptian doctors (1550 BC) described a disease with 'excessive thirst and urination' — the first record of diabetes.",
  "The word 'diabetes' comes from Greek 'diabainein' — 'to pass through.' 'Mellitus' was added later — 'sweet like honey.'",
  "Sharon Stone has lived with diabetes since childhood and actively supports diabetes charities.",
  "About 537 million adults worldwide live with diabetes (2021 data). That's 1 in 10 adults.",
  "The first portable glucose meter appeared in 1970. Before that, patients estimated sugar levels by test strip color.",
  "Type 2 diabetes accounts for about 90% of all diabetes cases worldwide.",
  "In 2016, the FDA approved the first 'artificial pancreas' — a system that automatically regulates insulin delivery.",
  "Exercise boosts insulin sensitivity for 24–48 hours after a workout.",
  "Theresa May, former UK Prime Minister, lives with type 1 diabetes and wears an insulin pump.",
  "In 2022, scientists successfully reversed type 1 diabetes in mice using stem cells.",
  "Actress Halle Berry claims she 'reversed' her type 2 diabetes with a keto diet.",
  "Diabetes was one of the first diseases described in the Ebers Papyrus (1550 BC).",
  "People with type 1 diabetes average about 40,000 insulin injections over a lifetime.",
  "China has the highest number of people with diabetes — over 140 million.",
];

export default function DailyTips({ settings }) {
  const lang = settings.language;
  const facts = lang === "uk" ? FACTS_UK : FACTS_EN;
  const [index, setIndex] = useState(() => Math.floor(Math.random() * facts.length));

  function nextFact() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * facts.length);
    } while (newIndex === index && facts.length > 1);
    setIndex(newIndex);
  }

  return (
    <div className="space-y-5">
      <MascotHint
        show={settings.show_mascot !== false}
        lang={lang}
        ukText="🦖 Цікаві факти про діабет — історія, відомі люди, відкриття. Ти дізнаєшся багато нового! 📚"
        enText="🦖 Interesting facts about diabetes — history, famous people, discoveries. Learn something new! 📚"
      />
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {lang === "uk" ? "Факти" : "Facts"}
        </h1>
      </div>

      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-2xl border border-border/50 p-6">
        <p className="text-sm text-foreground leading-relaxed">{facts[index]}</p>
      </div>

      <button
        onClick={nextFact}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border/50 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        {lang === "uk" ? "Інший факт" : "Another fact"}
      </button>
    </div>
  );
}