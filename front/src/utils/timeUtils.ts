/**
 * Formate une date en temps relatif (ex: "il y a 2 secondes", "il y a 5 minutes", "il y a 3 heures")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `il y a ${diffInSeconds} seconde${diffInSeconds !== 1 ? 's' : ''}`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `il y a ${diffInHours} heure${diffInHours !== 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `il y a ${diffInDays} jour${diffInDays !== 1 ? 's' : ''}`;
}

