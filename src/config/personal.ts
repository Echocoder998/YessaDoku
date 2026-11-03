/**
 * Personalize the gift here. This is the only file you need to edit.
 *
 * - herName            greeting on the home screen: "Hi {herName}!"
 * - secretUnlockAt     how many solved puzzles reveal the secret note
 * - secretMessage      the note itself
 * - winMessages        one is chosen at random on the win screen
 *
 * Photo (optional): save a picture as src/assets/secret.jpg
 * (that folder, not public/). It appears with the secret note.
 * Leave it out and the note just shows the words.
 */

const secretModules = import.meta.glob("../assets/secret.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const secretPhoto = Object.values(secretModules)[0] ?? null;

export const personal = {
  herName: "Love",
  secretUnlockAt: 5,
  secretMessage:
    "You have cleared enough of these that I get to say the quiet part.\n\nI see how hard you are working for the NCLEX. The long notes, the second-guessing, the way you still show up kind. I made this so a study break could feel like us at the table with a deck of cards, not another quiz app.\n\nYou are going to be an incredible nurse. I am already proud of you.\n\nI am in your corner. Always.",
  winMessages: [
    "UNO! The grid never stood a chance.",
    "That's my future nurse, outsmarting a puzzle.",
    "Color me impressed. Again.",
    "Wild card energy. You always had it.",
    "You just diagnosed this board: solved.",
    "Another one down. The puzzles are losing.",
    "Take the win. You earned the smug little smile.",
  ],
  secretPhoto,
};

export function pickWinMessage(): string {
  const list = personal.winMessages;
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? list[0] ?? "UNO!";
}
