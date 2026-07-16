export type HelpPage = {
  page: number;
  title: string;
  description?: string;
  image: string;
  content: string;
};

export const helpPages: HelpPage[] = [
  {
    page: 0,
    title: "What is Sugar Heart",
    image: "/images/magic.gif",
    description: "A magical diary inspired by Sugar Sugar Rune",
    content:
      "Every diary entry reveals the color of your heart. Collect colorful Hearts, grow your magic, and one day you might become the next Queen of the Witch World!",
  },
  {
    page: 1,
    title: "The Pendant",
    description: "Show your peace sign to the camera",
    image: "/images/peace.jpg",
    content:
      "You can open the pendant with your Peek-a-Boo Glasses. Once you allow camera access, the AI will recognize your hand gesture. Hold a ✌ near your eye to unlock it. You can also click the pendant instead, but every real witch knows how to use Peek-a-Boo Glasses!",
  },
  {
    page: 2,
    title: "Collect Hearts",
    image: "/images/heart.gif",
    description: "Write down your thoughts and feelings",
    content:
      "Write your feelings in your diary, and the magical pendant will analyze them to reveal your heart color. Each color represents different emotions. Collect Hearts of different colors to grow your witch rank!",
  },
  {
    page: 3,
    title: "Terms",
    description: "Privacy and data usage",
    image: "/images/wand.gif",
    content:
      "To use gesture recognition and voice features, Sugar Heart requires access to your camera and microphone. We do not record, store, or share your camera or audio data.",
  },
  {
    page: 4,
    title: "About",
    description: "Before you go",
    image: "/images/bye.gif",
    content:
      "This is a non-commercial personal project inspired by Sugar Sugar Rune. It is an unofficial fan-made project and is not affiliated with or endorsed by the original creators or rights holders.\n\nSource: Sugar Sugar Rune (Anime)\nAll rights to Sugar Sugar Rune and any original images or related materials belong to their respective copyright owners.",
  },
];
