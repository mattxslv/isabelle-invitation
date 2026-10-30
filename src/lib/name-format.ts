// Capitalize name initials without changing deliberate spelling such as McDonald.
export function capitalizeName(name: string): string {
  return name.replace(/(^|[\s'-])(\p{L})/gu, (_match, boundary: string, letter: string) => boundary + letter.toLocaleUpperCase("en-PH"));
}
