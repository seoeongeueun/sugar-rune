export type HeartColor =
  | "red"
  | "cyan"
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

  // heart value
  value: number;
};

//!important: on values change, change the sql trigger in the db as well
export const HEART_LIST: HeartCategory[] = [
  {
    color: "red",
    hex: "#fb120e",
    label: "Love",
    description:
      "Deep, mature, and committed romantic love. Strong emotional attachment, devotion, lasting affection, and gratitude toward a romantic partner.",

    keywords: [
      "love",
      "devotion",
      "commitment",
      "gratitude",
      "partner",
      "relationship",
    ],

    examples: [
      "I felt grateful spending the day with my spouse.",
      "Even after all this time, I still deeply love them.",
      "오랜 연인과 함께하며 다시 한 번 사랑을 느꼈다.",
    ],
    value: 5000,
  },
  {
    color: "pink",
    hex: "#eb77b4",
    label: "Affection",
    description:
      "The excitement and butterflies of new romantic feelings. A crush, infatuation, admiration, or the first buds of love before it becomes deep commitment.",

    keywords: [
      "crush",
      "infatuation",
      "admiration",
      "romance",
      "attraction",
      "butterflies",
    ],

    examples: [
      "I couldn't stop thinking about them today.",
      "My heart raced every time I saw them.",
      "좋아하는 사람이 웃어줘서 하루 종일 설렜다.",
    ],
    value: 1000,
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
    value: 5,
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
    value: 350,
  },
  {
    color: "cyan",
    hex: "#00BCD4",
    label: "Family",
    description:
      "Love, care, comfort, and emotional warmth shared within a family. Feeling protected, caring for family members, or appreciating their support.",

    keywords: [
      "family",
      "mother",
      "father",
      "parents",
      "siblings",
      "home",
      "care",
    ],

    examples: [
      "My mom cooked my favorite meal today.",
      "I felt thankful for my family's support.",
      "부모님과 함께 저녁을 먹으며 따뜻함을 느꼈다.",
    ],
    value: 350,
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
    value: 2500,
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
    value: 1000,
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
    value: 1000,
  },
];
