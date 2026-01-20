import type {
  ReleveSysteme,
  InstallationSysteme,
  VerificationSysteme,
} from '@/types/database.types';

export function formatSystemDetails(
  system: ReleveSysteme | InstallationSysteme | VerificationSysteme
): string[] {
  const details: string[] = [];

  details.push(`Modèle: ${system.modele}`);
  details.push(`Quantité: ${system.quantite}`);
  details.push(`Tube: ${system.tube ? 'Oui' : 'Non'}`);
  details.push(`Pressostat: ${system.pressostat ? 'Oui' : 'Non'}`);

  if (system.pressostat && system.pressostat_type) {
    details.push(`  Type pressostat: ${system.pressostat_type}`);
  }

  details.push(
    `Sprinkler: ${system.tete_sprinkler ? 'Oui' : 'Non'}`
  );

  if (system.tete_sprinkler) {
    details.push(`  Nombre: ${system.tete_sprinkler_quantite}`);
    if (system.tete_sprinkler_temperature) {
      details.push(`  Température: ${system.tete_sprinkler_temperature}°C`);
    }
  }

  details.push(`Sirène flash: ${system.sirene_flash ? 'Oui' : 'Non'}`);

  if ('panneau' in system) {
    details.push(`Panneau: ${system.panneau ? 'Oui' : 'Non'}`);
    details.push(
      `Contact NF suppl.: ${system.contact_nf_suppl ? 'Oui' : 'Non'}`
    );
  }

  return details;
}

export function formatVolume(
  longueur?: number,
  hauteur?: number,
  profondeur?: number
): string {
  if (!longueur || !hauteur || !profondeur) return 'N/A';
  const volume = (longueur * hauteur * profondeur).toFixed(2);
  return `${volume} m³ (L: ${longueur}m × H: ${hauteur}m × P: ${profondeur}m)`;
}

export function formatVentilation(
  ventilation: boolean,
  nb_ventilations?: number
): string {
  if (!ventilation) return 'Non';
  return `Oui${nb_ventilations ? ` (${nb_ventilations})` : ''}`;
}
