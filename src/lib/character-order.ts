type CharacterIdentity = {
  id: string;
  name: string;
};

function isJesus(character: CharacterIdentity): boolean {
  return character.id === "jesus-of-nazareth" || character.id === "jesus" ||
    ["jesus", "jesus of nazareth"].includes(character.name.trim().toLowerCase());
}

function isEric(character: CharacterIdentity): boolean {
  return character.id === "eric-oberhausen" || character.id === "eric" ||
    character.name.trim().toLowerCase() === "eric";
}

export function orderPublicCharacters<T extends CharacterIdentity>(rows: readonly T[], defaults: readonly T[]): T[] {
  const source = rows.length ? rows : defaults;
  const jesus = source.find(isJesus) ?? defaults.find(isJesus);
  const eric = source.find(isEric) ?? defaults.find(isEric);
  const remaining = source.filter((character) =>
    !isJesus(character) &&
    !isEric(character) &&
    character.id !== "mary-mother-of-jesus" &&
    character.name.trim().toLowerCase() !== "mary, mother of jesus"
  );

  return [...(jesus ? [jesus] : []), ...(eric ? [eric] : []), ...remaining];
}
