
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "2025-03-01",
    title: "✨ Перфектни преходи",
    description: "Коригирахме анимациите в университетския изглед, за да съвпадат точно с училищния и да предоставят по-гладко изживяване."
  },
  {
    version: "1.9.9",
    date: "2025-03-01",
    title: "✨ Пречистени анимации",
    description: "Направихме прехода между ролите и предметите по-лесен за очите с нежен fade-in ефект."
  },
  {
    version: "1.9.8",
    date: "2025-03-01",
    title: "✨ Пречистен изглед",
    description: "Оптимизирахме прозореца за новости, за да виждате най-важното бързо и без излишен шум."
  }
];