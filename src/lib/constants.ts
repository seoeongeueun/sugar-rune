//heart animations
export const OPEN_ANGLE = -Math.PI / 1.2857; // 140도
export const OPEN_SPEED = 4;
export const CALENDAR_START_YEAR = 2026;

export type HeartColor =
  | "red"
  | "yellow"
  | "green"
  | "pink"
  | "purple"
  | "black"
  | "white";

export type HeartCategory = {
  color: HeartColor;
  hex: string;

  // UI 표시용
  label: string;

  // Nova Lite Prompt용
  description: string;

  // 대표 감정 키워드
  keywords: string[];

  // Nova가 의미를 이해하기 위한 예시
  examples: string[];
};

export const HEART_LIST: HeartCategory[] = [
  {
    color: "red",
    hex: "#fb120e",
    label: "Love",
    description:
      "Romantic love, deep emotional attachment, devotion, gratitude toward a partner or loved one.",

    keywords: [
      "love",
      "romance",
      "gratitude",
      "devotion",
      "relationship",
      "partner",
    ],

    examples: [
      "I spent a wonderful day with my partner.",
      "I feel grateful to have someone who truly loves me.",
      "오늘 여자친구와 데이트를 해서 정말 행복했다.",
    ],
  },

  {
    color: "yellow",
    hex: "#f7c331",
    label: "Surprise",
    description:
      "Unexpected events, excitement, amazement, curiosity, shock, or sudden discoveries.",

    keywords: ["surprise", "unexpected", "astonishment", "shock", "excitement"],

    examples: [
      "My friend suddenly gave me a gift.",
      "I couldn't believe what happened today.",
      "갑자기 선물을 받아서 정말 놀랐다.",
    ],
  },

  {
    color: "green",
    hex: "#4bf53d",
    label: "Friendship",
    description:
      "Friendship, trust, companionship, teamwork, mutual support, appreciation toward friends.",

    keywords: ["friend", "trust", "companionship", "support", "teamwork"],

    examples: [
      "I had a great time with my friends.",
      "My teammate really helped me today.",
      "친구와 즐거운 시간을 보냈다.",
    ],
  },

  {
    color: "pink",
    hex: "#eb77b4",
    label: "Affection",
    description:
      "Warmth, kindness, caring, family affection, comfort, empathy, emotional closeness.",

    keywords: ["care", "kindness", "comfort", "family", "warmth", "empathy"],

    examples: [
      "My mom cooked my favorite meal.",
      "I felt loved by my family today.",
      "가족과 함께 시간을 보내며 따뜻함을 느꼈다.",
    ],
  },

  {
    color: "purple",
    hex: "#9b59b6",
    label: "Lust / Desire",
    description:
      "Strong desire, attraction, passion, longing, ambition, craving, or intense motivation.",

    keywords: ["desire", "passion", "attraction", "longing", "ambition"],

    examples: [
      "I really wanted to achieve my goal.",
      "I felt strongly attracted to someone.",
      "목표를 반드시 이루고 싶다는 열망이 생겼다.",
    ],
  },

  {
    color: "black",
    hex: "#0a0b0f",
    label: "Hatred / Fear",
    description:
      "Fear, anxiety, anger, hatred, frustration, resentment, sadness caused by negative experiences.",

    keywords: ["fear", "anger", "hatred", "anxiety", "stress", "frustration"],

    examples: [
      "I was terrified during today's presentation.",
      "I felt angry because everything went wrong.",
      "오늘 너무 화가 났고 모든 것이 두려웠다.",
    ],
  },

  {
    color: "white",
    hex: "#f0eff4",
    label: "Purity",
    description:
      "Peace, calmness, healing, forgiveness, acceptance, clarity, emotional stability.",

    keywords: [
      "peace",
      "calm",
      "healing",
      "forgiveness",
      "clarity",
      "acceptance",
    ],

    examples: [
      "I spent a quiet day reading a book.",
      "Meditation made me feel peaceful.",
      "오늘은 아무 걱정 없이 평온한 하루였다.",
    ],
  },
];
