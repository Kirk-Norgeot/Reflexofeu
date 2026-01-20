import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    return '';
  }
}

export function formatDatetime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatVolume(volume?: number): string {
  if (!volume) return '-';
  return `${volume.toFixed(3)} m³`;
}

export function formatDimensions(
  hauteur?: number,
  longueur?: number,
  profondeur?: number
): string {
  if (!hauteur || !longueur || !profondeur) return '-';
  return `${hauteur} × ${longueur} × ${profondeur} cm`;
}

export function getStatutBadgeClass(statut: string): string {
  const statusMap: Record<string, string> = {
    'à faire': 'bg-yellow-100 text-yellow-800',
    'en cours': 'bg-blue-100 text-blue-800',
    'fait': 'bg-green-100 text-green-800',
    'brouillon': 'bg-gray-100 text-gray-800',
    'completée': 'bg-green-100 text-green-800',
  };
  return statusMap[statut] || 'bg-gray-100 text-gray-800';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
