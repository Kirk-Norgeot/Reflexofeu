# 📡 API Reference - ReflexOFeu

Documentation complète des services API et leurs méthodes.

---

## 🔐 Authentication Service

**Fichier:** `src/services/auth.service.ts`

### `authService.signIn(email, password)`
Connexion utilisateur avec email et mot de passe.

```typescript
const { user, session } = await authService.signIn(
  'admin@reflexofeu.fr',
  'admin123'
);
```

### `authService.signUp(email, password, fullName, role?)`
Créer un nouveau compte utilisateur.

```typescript
await authService.signUp(
  'tech@exemple.fr',
  'password123',
  'Jean Dupont',
  'technicien' // optionnel, défaut: 'technicien'
);
```

### `authService.signOut()`
Déconnexion de l'utilisateur actuel.

```typescript
await authService.signOut();
```

### `authService.getCurrentUser()`
Récupérer l'utilisateur actuellement connecté.

```typescript
const user = await authService.getCurrentUser();
```

### `authService.getCurrentProfile()`
Récupérer le profil complet de l'utilisateur actuel.

```typescript
const profile = await authService.getCurrentProfile();
// { id, email, full_name, role, created_at, updated_at }
```

### `authService.onAuthStateChange(callback)`
Écouter les changements d'état d'authentification.

```typescript
const subscription = authService.onAuthStateChange((user) => {
  console.log('User changed:', user);
});

// Cleanup
subscription.data.subscription.unsubscribe();
```

---

## 👥 Clients Service

**Fichier:** `src/services/clients.service.ts`

### `clientsService.getAll()`
Récupérer tous les clients avec leurs sites.

```typescript
const clients: ClientWithSites[] = await clientsService.getAll();
```

### `clientsService.getById(id)`
Récupérer un client par son ID.

```typescript
const client = await clientsService.getById('uuid-client');
```

### `clientsService.create(client, userId)`
Créer un nouveau client.

```typescript
const newClient = await clientsService.create({
  nom: 'ACME Corporation',
  adresse: '123 Rue de la Paix',
  adresse2: 'Bâtiment A',
  code_postal: '75001',
  ville: 'Paris',
  contact: 'Jean Dupont',
  telephone: '0123456789',
  email: 'contact@acme.fr',
  multi_site: true,
}, userId);
```

### `clientsService.update(id, updates)`
Mettre à jour un client.

```typescript
await clientsService.update('uuid-client', {
  telephone: '0987654321',
});
```

### `clientsService.delete(id)`
Supprimer un client.

```typescript
await clientsService.delete('uuid-client');
```

### `clientsService.searchByFilters(filters)`
Rechercher des clients avec filtres.

```typescript
const clients = await clientsService.searchByFilters({
  clientId: 'uuid-client', // optionnel
  ville: 'Paris', // optionnel
  codePostal: '75', // optionnel
});
```

---

## 🏢 Sites Service

**Fichier:** `src/services/clients.service.ts`

### `sitesService.getAll()`
Récupérer tous les sites.

```typescript
const sites = await sitesService.getAll();
```

### `sitesService.getById(id)`
Récupérer un site par son ID.

```typescript
const site = await sitesService.getById('uuid-site');
```

### `sitesService.getByClientId(clientId)`
Récupérer tous les sites d'un client.

```typescript
const sites = await sitesService.getByClientId('uuid-client');
```

### `sitesService.create(site)`
Créer un nouveau site.

```typescript
const newSite = await sitesService.create({
  client_id: 'uuid-client',
  nom: 'Site de production Paris Nord',
  adresse: '456 Avenue des Champs',
  code_postal: '75008',
  ville: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
});
```

### `sitesService.update(id, updates)`
Mettre à jour un site.

```typescript
await sitesService.update('uuid-site', {
  latitude: 48.8600,
  longitude: 2.3500,
});
```

### `sitesService.delete(id)`
Supprimer un site.

```typescript
await sitesService.delete('uuid-site');
```

### `sitesService.getSitesWithCoordinates()`
Récupérer uniquement les sites avec coordonnées GPS.

```typescript
const sitesWithGPS = await sitesService.getSitesWithCoordinates();
```

---

## 🗄️ Armoires Service

**Fichier:** `src/services/armoires.service.ts`

### `armoiresService.getAll()`
Récupérer toutes les armoires.

```typescript
const armoires = await armoiresService.getAll();
```

### `armoiresService.getById(id)`
Récupérer une armoire avec toutes ses relations.

```typescript
const armoire = await armoiresService.getById('uuid-armoire');
// Inclut: site, releve_etudes, installations, verifications
```

### `armoiresService.getBySiteId(siteId)`
Récupérer toutes les armoires d'un site.

```typescript
const armoires = await armoiresService.getBySiteId('uuid-site');
```

### `armoiresService.create(armoire)`
Créer une nouvelle armoire.

```typescript
const newArmoire = await armoiresService.create({
  site_id: 'uuid-site',
  nom_armoire: 'Armoire principale A1',
  zone: 'Production',
  hauteur: 200,
  longueur: 100,
  profondeur: 60,
  volume: 1.2,
  nb_cellules: 24,
  ventilation: true,
  arrivee_cables: 'Haut',
});
```

### `armoiresService.update(id, updates)`
Mettre à jour une armoire.

```typescript
await armoiresService.update('uuid-armoire', {
  nb_cellules: 32,
});
```

### `armoiresService.delete(id)`
Supprimer une armoire.

```typescript
await armoiresService.delete('uuid-armoire');
```

### `armoiresService.calculateVolume(h, l, p)`
Calculer le volume en m³.

```typescript
const volume = armoiresService.calculateVolume(200, 100, 60);
// Retourne: 1.2
```

---

## 📋 Relevé Service

**Fichier:** `src/services/releve.service.ts`

### `releveService.getAll()`
Récupérer tous les relevés.

```typescript
const releves = await releveService.getAll();
```

### `releveService.getById(id)`
Récupérer un relevé complet.

```typescript
const releve = await releveService.getById('uuid-releve');
// Inclut: armoire, releve_systemes, releve_photos
```

### `releveService.getByArmoireId(armoireId)`
Récupérer tous les relevés d'une armoire.

```typescript
const releves = await releveService.getByArmoireId('uuid-armoire');
```

### `releveService.create(releve)`
Créer un nouveau relevé.

```typescript
const newReleve = await releveService.create({
  armoire_id: 'uuid-armoire',
  date_releve: '2024-12-22',
  statut: 'brouillon',
});
```

### `releveSystemeService.create(systeme)`
Ajouter un système au relevé.

```typescript
await releveSystemeService.create({
  releve_etude_id: 'uuid-releve',
  modele: 'RV1m3',
  quantite: 2,
  tube: 'DN25',
  temperature_sprinkler: '57',
});
```

### `relevePhotoService.create(photo)`
Ajouter une photo au relevé.

```typescript
await relevePhotoService.create({
  releve_etude_id: 'uuid-releve',
  url_photo: 'https://storage.url/photo.jpg',
  position: 1,
});
```

---

## 🔧 Installation Service

**Fichier:** `src/services/installation.service.ts`

### `installationService.getAll()`
Récupérer toutes les installations.

```typescript
const installations = await installationService.getAll();
```

### `installationService.getById(id)`
Récupérer une installation complète.

```typescript
const installation = await installationService.getById('uuid-install');
// Inclut: armoire, installation_systemes, installation_photos
```

### `installationService.getByArmoireId(armoireId)`
Récupérer l'installation d'une armoire.

```typescript
const installation = await installationService.getByArmoireId('uuid-armoire');
```

### `installationService.create(installation)`
Créer une nouvelle installation.

```typescript
const newInstallation = await installationService.create({
  armoire_id: 'uuid-armoire',
  releve_etude_id: 'uuid-releve', // optionnel
  date_installation: '2024-12-22',
  statut: 'à faire',
  hauteur: 200,
  longueur: 100,
  profondeur: 60,
  volume: 1.2,
  nb_cellules: 24,
  ventilation: true,
  arrivee_cables: 'Haut',
});
```

### `installationSystemeService.create(systeme)`
Ajouter un système à l'installation.

```typescript
await installationSystemeService.create({
  installation_id: 'uuid-install',
  modele: 'RV1m3',
  quantite: 2,
  tube: 'DN25',
  temperature_sprinkler: '57',
  sirene_flash: true,
  panneau: false,
  contact_nf_suppl: true,
});
```

---

## ✅ Vérification Service

**Fichier:** `src/services/verification.service.ts`

### `verificationService.getAll()`
Récupérer toutes les vérifications.

```typescript
const verifications = await verificationService.getAll();
```

### `verificationService.getById(id)`
Récupérer une vérification complète.

```typescript
const verification = await verificationService.getById('uuid-verif');
// Inclut: armoire, verification_systemes, verification_photos
```

### `verificationService.getByArmoireId(armoireId)`
Récupérer la vérification d'une armoire.

```typescript
const verification = await verificationService.getByArmoireId('uuid-armoire');
```

### `verificationService.create(verification)`
Créer une nouvelle vérification.

```typescript
const newVerification = await verificationService.create({
  armoire_id: 'uuid-armoire',
  installation_id: 'uuid-install', // optionnel
  date_verification: '2024-12-22',
  statut: 'à faire',
  commentaire: 'Vérification complète effectuée sans anomalie.',
});
```

---

## 📄 Documents Service

**Fichier:** `src/services/documents.service.ts`

### `documentsService.getAll()`
Récupérer tous les documents.

```typescript
const documents = await documentsService.getAll();
```

### `documentsService.getById(id)`
Récupérer un document par son ID.

```typescript
const document = await documentsService.getById('uuid-doc');
```

### `documentsService.getByClientId(clientId)`
Récupérer tous les documents d'un client.

```typescript
const documents = await documentsService.getByClientId('uuid-client');
```

### `documentsService.getByCategory(categoryId)`
Récupérer tous les documents d'une catégorie.

```typescript
const documents = await documentsService.getByCategory('uuid-category');
```

### `documentsService.create(document, userId)`
Créer un nouveau document.

```typescript
const newDocument = await documentsService.create({
  client_id: 'uuid-client', // optionnel
  site_id: 'uuid-site', // optionnel
  armoire_id: 'uuid-armoire', // optionnel
  category_id: 'uuid-category',
  transfer_type_id: 'uuid-type',
  titre: 'Certificat CE - Armoire A1',
  type_fichier: 'PDF',
  url_fichier: 'https://storage.url/certificat.pdf',
}, userId);
```

### `documentCategoriesService.getAll()`
Récupérer toutes les catégories de documents.

```typescript
const categories = await documentCategoriesService.getAll();
```

### `transferTypesService.getAll()`
Récupérer tous les types de transfert.

```typescript
const types = await transferTypesService.getAll();
```

---

## 🗺️ Geocoding Utils

**Fichier:** `src/utils/geocoding.ts`

### `geocodeAddress(adresse, codePostal, ville)`
Géocoder une adresse avec Nominatim.

```typescript
const coords = await geocodeAddress(
  '123 Rue de la Paix',
  '75001',
  'Paris'
);
// Retourne: { latitude: 48.8566, longitude: 2.3522 }
```

### `calculateDistance(lat1, lon1, lat2, lon2)`
Calculer la distance entre deux points GPS (en km).

```typescript
const distance = calculateDistance(
  48.8566, 2.3522, // Paris
  43.6047, 1.4442  // Toulouse
);
// Retourne: ~590 km
```

---

## 📦 Storage Utils

**Fichier:** `src/utils/storage.ts`

### `uploadPhotoToStorage(file, bucket?)`
Uploader une photo vers Supabase Storage.

```typescript
const url = await uploadPhotoToStorage(file, 'photos');
// Retourne: 'https://storage.url/photos/timestamp-filename.jpg'
```

### `deletePhotoFromStorage(url, bucket?)`
Supprimer une photo de Supabase Storage.

```typescript
const success = await deletePhotoFromStorage(
  'https://storage.url/photos/photo.jpg',
  'photos'
);
// Retourne: true/false
```

---

## 🎨 Format Utils

**Fichier:** `src/utils/format.ts`

### `formatDate(date, formatStr?)`
Formater une date.

```typescript
formatDate('2024-12-22'); // "22/12/2024"
formatDate('2024-12-22', 'yyyy-MM-dd'); // "2024-12-22"
```

### `formatDatetime(date)`
Formater une date avec heure.

```typescript
formatDatetime('2024-12-22T15:30:00'); // "22/12/2024 15:30"
```

### `formatVolume(volume)`
Formater un volume en m³.

```typescript
formatVolume(1.234); // "1.234 m³"
```

### `formatDimensions(h, l, p)`
Formater des dimensions.

```typescript
formatDimensions(200, 100, 60); // "200 × 100 × 60 cm"
```

### `getStatutBadgeClass(statut)`
Obtenir la classe CSS pour un badge de statut.

```typescript
getStatutBadgeClass('fait'); // "bg-green-100 text-green-800"
getStatutBadgeClass('à faire'); // "bg-yellow-100 text-yellow-800"
```

---

## 📝 Notes importantes

### Gestion des erreurs

Tous les services propagent les erreurs. Utilisez try/catch :

```typescript
try {
  const client = await clientsService.getById('invalid-id');
} catch (error) {
  console.error('Error:', error.message);
}
```

### React Query

Pour utiliser les services avec React Query, utilisez les hooks dans `src/hooks/` :

```typescript
import { useClients, useCreateClient } from '@/hooks/useClients';

function MyComponent() {
  const { data: clients, isLoading } = useClients();
  const { mutate: createClient } = useCreateClient();

  // ...
}
```

### Types TypeScript

Tous les types sont dans `src/types/database.types.ts` :

```typescript
import type { Client, Site, Armoire } from '@/types/database.types';
```

---

**Documentation mise à jour:** 22 décembre 2024
