export type UserRole = 'technicien' | 'admin';

export type ModeleSysteme = 'RV0.5m3' | 'RV1m3' | 'RV1.5m3' | 'RV2m3' | 'RV2.5m3' | 'RV3m3';

export type TemperatureSprinkler = '40' | '57' | '68' | '79' | '93';

export type ArriveeCables = 'Haut' | 'Bas';

export type TypeContact = 'NO' | 'NF' | 'NO/NF';

export type EtatTube = 'Bon' | 'Pincé' | 'Défectueux';

export type StatutReleve = 'brouillon' | 'completée';

export type StatutInstallation = 'à faire' | 'en cours' | 'fait';

export type StatutVerification = 'à faire' | 'fait';

export type TypeFichier = 'PDF' | 'vidéo' | 'image';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  nom: string;
  adresse: string;
  adresse2?: string;
  code_postal: string;
  ville: string;
  contact?: string;
  telephone?: string;
  email?: string;
  multi_site: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  client_id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Armoire {
  id: string;
  site_id: string;
  nom_armoire: string;
  zone?: string;
  hauteur?: number;
  longueur?: number;
  profondeur?: number;
  volume?: number;
  nb_cellules?: number;
  ventilation: boolean;
  nb_ventilations?: number;
  arrivee_cables?: ArriveeCables;
  created_at: string;
  updated_at: string;
}

export interface ReleveEtude {
  id: string;
  armoire_id: string;
  session_id?: string;
  date_releve: string;
  statut: StatutReleve;
  created_at: string;
  updated_at: string;
}

export interface ReleveSysteme {
  id: string;
  releve_etude_id: string;
  modele: ModeleSysteme;
  quantite: number;
  tube: boolean;
  pressostat: boolean;
  pressostat_type?: TypeContact;
  pressostat_quantite?: number;
  tete_sprinkler: boolean;
  tete_sprinkler_quantite: number;
  tete_sprinkler_temperature?: TemperatureSprinkler;
  sirene_flash: boolean;
  sirene_flash_quantite?: number;
  created_at: string;
}

export interface RelevePhoto {
  id: string;
  releve_etude_id: string;
  url_photo: string;
  position: number;
  created_at: string;
}

export interface Installation {
  id: string;
  armoire_id: string;
  releve_etude_id?: string;
  date_installation: string;
  statut: StatutInstallation;
  hauteur?: number;
  longueur?: number;
  profondeur?: number;
  volume?: number;
  nb_cellules?: number;
  ventilation?: boolean;
  nb_ventilations?: number;
  arrivee_cables?: ArriveeCables;
  created_at: string;
  updated_at: string;
}

export interface InstallationSysteme {
  id: string;
  installation_id: string;
  modele: ModeleSysteme;
  quantite: number;
  tube: boolean;
  pressostat: boolean;
  pressostat_type?: TypeContact;
  pressostat_quantite?: number;
  tete_sprinkler: boolean;
  tete_sprinkler_quantite: number;
  tete_sprinkler_temperature?: TemperatureSprinkler;
  sirene_flash: boolean;
  sirene_flash_quantite?: number;
  panneau: boolean;
  contact_nf_suppl: boolean;
  created_at: string;
}

export interface InstallationPhoto {
  id: string;
  installation_id: string;
  url_photo: string;
  position: number;
  created_at: string;
}

export interface Verification {
  id: string;
  armoire_id: string;
  installation_id?: string;
  date_verification: string;
  statut: StatutVerification;
  commentaire?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationSysteme {
  id: string;
  verification_id: string;
  modele: ModeleSysteme;
  quantite: number;
  tube: boolean;
  pressostat: boolean;
  pressostat_type?: TypeContact;
  pressostat_quantite?: number;
  tete_sprinkler: boolean;
  tete_sprinkler_quantite: number;
  tete_sprinkler_temperature?: TemperatureSprinkler;
  sirene_flash: boolean;
  sirene_flash_quantite?: number;
  panneau: boolean;
  contact_nf_suppl: boolean;
  pression_ok: boolean;
  etat_tube: EtatTube;
  tete_sprinkler_ok: boolean;
  sirene_flash_ok: boolean;
  batterie_changee: boolean;
  etat_environnement?: string[];
  etat_environnement_autre?: string;
  created_at: string;
}

export interface VerificationPhoto {
  id: string;
  verification_id: string;
  url_photo: string;
  position: number;
  created_at: string;
}

export interface DocumentCategory {
  id: string;
  nom: string;
  description?: string;
  created_at: string;
}

export interface TransferType {
  id: string;
  nom: string;
  description?: string;
  created_at: string;
}

export interface Document {
  id: string;
  client_id?: string;
  site_id?: string;
  armoire_id?: string;
  category_id?: string;
  transfer_type_id?: string;
  titre: string;
  type_fichier: TypeFichier;
  url_fichier: string;
  created_by: string;
  date_ajout: string;
  created_at: string;
}

export interface ClientWithSites extends Client {
  sites?: Site[];
}

export interface SiteWithArmoires extends Site {
  armoires?: Armoire[];
  client?: Client;
}

export interface ArmoireWithRelations extends Armoire {
  site?: Site;
  releve_etudes?: ReleveEtude[];
  installations?: Installation[];
  verifications?: Verification[];
}

export interface ReleveEtudeComplete extends ReleveEtude {
  armoire?: Armoire;
  releve_systemes?: ReleveSysteme[];
  releve_photos?: RelevePhoto[];
}

export interface InstallationComplete extends Installation {
  armoire?: Armoire;
  installation_systemes?: InstallationSysteme[];
  installation_photos?: InstallationPhoto[];
}

export interface VerificationComplete extends Verification {
  armoire?: Armoire;
  verification_systemes?: VerificationSysteme[];
  verification_photos?: VerificationPhoto[];
}

export interface SignatureReleve {
  id: string;
  releve_id?: string;
  session_id?: string;
  signature_data: string;
  signed_at: string;
  signed_by?: string;
  created_at: string;
}

export interface SignatureInstallation {
  id: string;
  site_id: string;
  signature_data: string;
  signed_at: string;
  signed_by?: string;
  created_at: string;
}

export interface SignatureVerification {
  id: string;
  session_id: string;
  signature_data: string;
  signed_by: string;
  created_at: string;
}
