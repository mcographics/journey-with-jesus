const OTHER_BIBLE_CHARACTER_NAMES = [
  "Aaron", "Abigail", "Abraham", "Absalom", "Adam", "Amos", "Andrew", "Anna",
  "Bartholomew", "Boaz", "Caleb", "Cornelius", "Daniel", "David", "Deborah",
  "Delilah", "Elijah", "Elisha", "Elizabeth", "Esther", "Eve", "Ezekiel",
  "Gabriel", "Gideon", "Hannah", "Hezekiah", "Isaac", "Isaiah", "Ishmael",
  "Jacob", "James", "Jeremiah", "Jesse", "Job", "Joel", "John the Apostle",
  "John the Baptist", "Jonah", "Joseph (husband of Mary)", "Joseph (son of Jacob)",
  "Joseph of Arimathea", "Joshua", "Josiah", "Judas Iscariot", "Lazarus", "Leah",
  "Lot", "Luke", "Lydia", "Malachi", "Martha", "Mary Magdalene",
  "Mary (mother of Jesus)", "Matthew", "Micah", "Miriam", "Moses", "Naomi", "Nathan",
  "Nehemiah", "Nicodemus", "Noah", "Paul", "Peter", "Philip", "Pontius Pilate",
  "Rahab", "Rachel", "Rebekah", "Ruth", "Samson", "Samuel", "Sarah", "Saul", "Silas",
  "Solomon", "Stephen", "Thomas", "Timothy", "Titus", "Zacchaeus", "Zechariah",
] as const;

function normalizeCharacterName(name: string): string {
  return name.replace(/[().,']/g, " ").trim().toLowerCase().split(" ").filter(Boolean).join(" ");
}

const alphabetizedBibleCharacters = [...OTHER_BIBLE_CHARACTER_NAMES].sort((left, right) =>
  normalizeCharacterName(left).localeCompare(normalizeCharacterName(right), "en"),
);

export const BIBLE_CHARACTER_NAMES = ["Jesus", ...alphabetizedBibleCharacters] as const;

export function isBibleCharacterName(value: string | null | undefined): boolean {
  return typeof value === "string" && (BIBLE_CHARACTER_NAMES as readonly string[]).includes(value.trim());
}
