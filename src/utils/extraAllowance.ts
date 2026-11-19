/** First letter of an extra vacation bucket's name, used as its symbol (e.g. "Extra" -> "E"). */
export function bucketInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?';
}
