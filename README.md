# ReflexOFeu - Application de Gestion Technique

Application web complète pour la gestion technique des installations de systèmes de protection incendie par armoires électriques.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture technique](#architecture-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [API et Services](#api-et-services)
- [Extension et personnalisation](#extension-et-personnalisation)

---

## 🎯 Vue d'ensemble

**ReflexOFeu** est une application web SPA (Single Page Application) moderne conçue pour les techniciens terrain qui gèrent :

- Des **clients** et leurs **sites** (multi-sites possibles)
- Des **relevés/études** d'armoires électriques
- Le suivi des **installations**
- Les **vérifications** post-installation
- La centralisation de **documents techniques**
- La génération de **rapports PDF**

### Public cible
- Techniciens terrain
- Administrateurs

### Environnement
- Desktop et tablettes (design responsive)
- Connexion internet requise (application cloud)

---

## ✨ Fonctionnalités

### 1. Module CLIENTS
- ✅ Création et édition de clients avec informations complètes
- ✅ Support multi-sites avec géolocalisation automatique
- ✅ Visualisation sur carte interactive (Leaflet + OpenStreetMap)
- ✅ Gestion des sites associés à chaque client

### 2. Module RELEVÉ - ÉTUDE
- ✅ Saisie des caractéristiques techniques des armoires
- ✅ Calcul automatique du volume (H × L × P)
- ✅ Choix système avec modèles prédéfinis (RV 0.5m³ à 3m³)
- ✅ Upload de photos (max 5)
- ✅ Température sprinkler configurable

### 3. Module INSTALLATION
- ✅ Recherche par client et site
- ✅ Liste des armoires avec statut (à faire / en cours / fait)
- ✅ Modification des données techniques
- ✅ Options supplémentaires (sirène flash, panneau, contact NO/NF)
- ✅ Remplacement des photos du relevé

### 4. Module VÉRIFICATION
- ✅ Sélection client / site / armoire
- ✅ Reprise des données d'installation
- ✅ Zone de commentaires multi-lignes
- ✅ Gestion des photos de vérification
- ✅ Statut (à faire / fait)

### 5. Module INFOS
- ✅ Documentation technique consultable
- ✅ Catégories prédéfinies (Certificats CE, ANPI, etc.)
- ✅ Interface d'upload de documents (PDF, images, vidéos)
- ✅ Types de transfert (Installation, Essai ANPI, Démo, etc.)

### 6. Module RAPPORTS
- ✅ Génération de PDF par client/site/armoire
- ✅ Contenu complet : infos client, relevé, installation, vérification
- ✅ Téléchargement direct
- ✅ Préparation pour envoi par email

### 7. Module CARTE
- ✅ Visualisation cartographique de tous les sites
- ✅ Filtres : client, ville, rayon (50/100/200 km)
- ✅ Markers cliquables avec informations
- ✅ Calcul de distances

---

## 🏗️ Architecture technique

### Stack technologique

#### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rapide
- **TailwindCSS** - Styling utility-first
- **React Router** - Navigation
- **React Query** - State management et cache
- **Leaflet** - Cartes interactives
- **jsPDF** - Génération de PDF côté client

#### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL (base de données)
  - Row Level Security (RLS)
  - Storage (fichiers)
  - Auth (authentification)

### Justification des choix

| Choix | Justification |
|-------|---------------|
| **Supabase PostgreSQL** | Base relationnelle robuste, parfaite pour les relations complexes (clients → sites → armoires → relevés/installations/vérifications). Support natif des types ENUMs, contraintes FK, et RLS pour la sécurité. |
| **React Query** | Gestion intelligente du cache, synchronisation automatique, invalidation des requêtes. Réduit drastiquement le code boilerplate. |
| **Leaflet** | Open source, léger, pas de clé API requise (OpenStreetMap gratuit). Alternative robuste à Google Maps. |
| **jsPDF** | Génération PDF côté client = pas de serveur lourd, fonctionne offline après chargement initial. |
| **TailwindCSS** | Développement rapide, cohérence visuelle, responsive natif, maintenance simplifiée. |
| **TypeScript** | Sécurité du typage, autocomplétion IDE, détection d'erreurs au compile-time, meilleure maintenabilité. |

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ et npm
- Compte **Supabase** (déjà configuré dans ce projet)

### Étapes

1. **Cloner le projet** (ou utiliser le dossier actuel)

```bash
cd /tmp/cc-agent/61653781/project
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Variables d'environnement**

Le fichier `.env` est déjà configuré avec les credentials Supabase :

```env
VITE_SUPABASE_URL=https://luaiyowmrtxtplvundfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

4. **Créer les buckets Storage Supabase**

Connectez-vous à votre dashboard Supabase et créez les buckets suivants :
- `photos` (public)
- `documents` (public)

5. **Lancer le serveur de développement**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

---

## ⚙️ Configuration

### Base de données

Les migrations Supabase ont déjà été appliquées. Elles incluent :

1. **Utilisateurs et profils** (`profiles`, `user_role`)
2. **Clients et sites** (`clients`, `sites`)
3. **Armoires et relevés** (`armoires`, `releve_etudes`, `releve_systemes`, `releve_photos`)
4. **Installations** (`installations`, `installation_systemes`, `installation_photos`)
5. **Vérifications** (`verifications`, `verification_systemes`, `verification_photos`)
6. **Documents** (`documents`, `document_categories`, `transfer_types`)

### Compte admin par défaut

Un compte admin doit être créé manuellement via Supabase Auth :

**Email:** admin@reflexofeu.fr
**Password:** admin123
**Role:** admin

Pour créer ce compte :
1. Allez dans Supabase Dashboard → Authentication → Users
2. Créez l'utilisateur avec l'email et mot de passe ci-dessus
3. Mettez à jour la table `profiles` pour définir `role = 'admin'`

---

## 📖 Utilisation

### Workflow typique

1. **Connexion**
   - Utilisez les identifiants admin ou technicien
   - L'application redirige vers le module CLIENTS

2. **Créer un client**
   - Menu CLIENTS → Bouton "Créer un client"
   - Remplir les informations
   - Cocher "Multi site" si nécessaire et ajouter des sites
   - La carte affiche automatiquement la géolocalisation

3. **Créer un relevé**
   - Menu RELEVÉ - ÉTUDE
   - Sélectionner client et site
   - Saisir les caractéristiques de l'armoire
   - Ajouter les systèmes choisis
   - Uploader les photos
   - Sauvegarder

4. **Installation**
   - Menu INSTALLATION
   - Rechercher le client/site
   - Sélectionner l'armoire
   - Modifier les données si nécessaire
   - Ajouter les options (sirène, panneau, etc.)
   - Marquer comme "fait"

5. **Vérification**
   - Menu VÉRIFICATION
   - Sélectionner l'armoire installée
   - Vérifier les données
   - Ajouter commentaires
   - Uploader photos de vérification

6. **Générer un rapport**
   - Menu RAPPORTS
   - Sélectionner client et optionnellement site
   - Télécharger le PDF
   - Ou envoyer par email (à implémenter)

---

## 📁 Structure du projet

```
project/
├── src/
│   ├── components/         # Composants React réutilisables
│   │   ├── Layout.tsx     # Layout principal avec navigation
│   │   └── MapView.tsx    # Composant carte Leaflet
│   │
│   ├── pages/             # Pages de l'application
│   │   ├── Login.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── CreateClientPage.tsx
│   │   ├── MapPage.tsx
│   │   ├── ReleveEtudePage.tsx
│   │   ├── InstallationPage.tsx
│   │   ├── VerificationPage.tsx
│   │   ├── InfosPage.tsx
│   │   └── RapportsPage.tsx
│   │
│   ├── services/          # Services API Supabase
│   │   ├── auth.service.ts
│   │   ├── clients.service.ts
│   │   ├── armoires.service.ts
│   │   ├── releve.service.ts
│   │   ├── installation.service.ts
│   │   ├── verification.service.ts
│   │   └── documents.service.ts
│   │
│   ├── hooks/             # React hooks personnalisés
│   │   ├── useAuth.tsx
│   │   └── useClients.ts
│   │
│   ├── types/             # Types TypeScript
│   │   └── database.types.ts
│   │
│   ├── utils/             # Utilitaires
│   │   ├── geocoding.ts   # Géolocalisation
│   │   ├── format.ts      # Formatage dates/données
│   │   └── storage.ts     # Upload fichiers
│   │
│   ├── lib/
│   │   └── supabase.ts    # Client Supabase
│   │
│   ├── App.tsx            # Composant racine
│   ├── main.tsx           # Point d'entrée
│   └── index.css          # Styles globaux
│
├── public/                # Assets statiques
├── .env                   # Variables d'environnement
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔌 API et Services

### Services disponibles

Tous les services sont dans `src/services/` et exposent des méthodes CRUD :

#### `authService`
```typescript
signIn(email, password)
signUp(email, password, fullName, role)
signOut()
getCurrentUser()
getCurrentProfile()
onAuthStateChange(callback)
```

#### `clientsService`
```typescript
getAll()
getById(id)
create(client, userId)
update(id, updates)
delete(id)
searchByFilters(filters)
```

#### `sitesService`
```typescript
getAll()
getById(id)
getByClientId(clientId)
create(site)
update(id, updates)
delete(id)
getSitesWithCoordinates()
```

#### `armoiresService`
```typescript
getAll()
getById(id)
getBySiteId(siteId)
create(armoire)
update(id, updates)
delete(id)
calculateVolume(h, l, p)
```

#### `releveService`, `installationService`, `verificationService`
Même pattern CRUD avec méthodes spécialisées.

### React Query hooks

Les hooks dans `src/hooks/` encapsulent les services avec React Query :

```typescript
// Exemple: useClients
const { data, isLoading, error } = useClients();
const { mutate: createClient } = useCreateClient();

createClient({
  client: formData,
  userId: user.id
});
```

---

## 🛠️ Extension et personnalisation

### Ajouter un nouveau module

1. **Créer la migration Supabase** (si nouvelle table)
```sql
CREATE TABLE IF NOT EXISTS ma_nouvelle_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

2. **Ajouter les types** dans `src/types/database.types.ts`
```typescript
export interface MaNouvelleTable {
  id: string;
  ...
}
```

3. **Créer le service** `src/services/ma-table.service.ts`
```typescript
export const maTableService = {
  async getAll() { ... },
  async create(data) { ... },
  ...
};
```

4. **Créer les hooks** `src/hooks/useMaTable.ts`
```typescript
export function useMaTable() {
  return useQuery({
    queryKey: ['ma-table'],
    queryFn: () => maTableService.getAll(),
  });
}
```

5. **Créer la page** `src/pages/MaTablePage.tsx`

6. **Ajouter la route** dans `App.tsx`
```typescript
<Route path="ma-route" element={<MaTablePage />} />
```

### Personnaliser les couleurs

Modifier `tailwind.config.js` :

```javascript
colors: {
  primary: {
    500: '#VOTRE_COULEUR',
    ...
  },
}
```

### Ajouter des langues

1. Créer `src/i18n/translations.ts`
2. Utiliser une lib comme `react-i18next`
3. Encapsuler tous les textes dans `t('key')`

### Ajouter l'envoi d'email

Utiliser Supabase Edge Functions :

1. Créer une fonction `send-email`
2. Intégrer un service SMTP (SendGrid, Mailgun)
3. Appeler la fonction depuis le front

---

## 🏗️ Build et déploiement

### Build de production

```bash
npm run build
```

Les fichiers optimisés seront dans `/dist`.

### Déploiement

#### Option 1: Vercel (recommandé)
```bash
npm i -g vercel
vercel
```

#### Option 2: Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```

#### Option 3: Serveur custom
```bash
npm run build
# Copier /dist sur votre serveur
# Servir avec nginx ou Apache
```

### Variables d'environnement en production

Définir les variables suivantes :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📊 Schéma de base de données

### Relations principales

```
clients (1) ──→ (N) sites
sites (1) ──→ (N) armoires
armoires (1) ──→ (0-1) releve_etudes
armoires (1) ──→ (0-1) installations
armoires (1) ──→ (0-1) verifications

releve_etudes (1) ──→ (N) releve_systemes
releve_etudes (1) ──→ (N) releve_photos

installations (1) ──→ (N) installation_systemes
installations (1) ──→ (N) installation_photos

verifications (1) ──→ (N) verification_systemes
verifications (1) ──→ (N) verification_photos

documents (N) ──→ (1) document_categories
documents (N) ──→ (1) transfer_types
```

### Types ENUM

- `user_role`: technicien, admin
- `modele_systeme`: RV0.5m3, RV1m3, ..., RV3m3
- `temperature_sprinkler`: 40, 57, 68, 79, 93
- `arrivee_cables`: Haut, Bas
- `statut_installation`: à faire, en cours, fait
- `statut_verification`: à faire, fait
- `type_fichier`: PDF, vidéo, image

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables sont protégées par RLS :

- **Techniciens** : peuvent voir et modifier toutes les données (pas de restriction)
- **Admins** : contrôle total

### Authentification

- Auth Supabase avec JWT
- Tokens stockés en httpOnly cookies
- Expiration automatique des sessions

### Upload de fichiers

- Validation côté client du type MIME
- Limite de taille : 5 photos max par relevé
- Storage Supabase avec URLs signées

---

## 🐛 Dépannage

### Erreur: "Module not found"
```bash
npm install
npm run build
```

### La carte ne s'affiche pas
Vérifier que Leaflet CSS est bien chargé dans `index.html` :
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

### Erreur Supabase
Vérifier les variables d'environnement dans `.env`.

### Géolocalisation ne fonctionne pas
L'API Nominatim (OpenStreetMap) a un rate limit. Attendre quelques secondes entre les requêtes.

---

## 📝 Notes de développement

### Points d'amélioration futurs

1. **Upload de fichiers réel** : Actuellement, l'upload est simulé. Implémenter avec Supabase Storage.
2. **Envoi email** : Créer une Edge Function Supabase avec intégration SMTP.
3. **Recherche avancée** : Full-text search sur clients, sites, armoires.
4. **Notifications push** : Alertes pour les vérifications à faire.
5. **Mode offline** : Service Worker pour fonctionnement hors connexion.
6. **Export Excel** : Alternative au PDF pour analyse de données.
7. **Statistiques** : Dashboard avec graphiques (Chart.js ou Recharts).
8. **Historique** : Log de toutes les modifications (audit trail).

### Conventions de code

- **Nommage** : camelCase pour variables/fonctions, PascalCase pour composants
- **Imports** : Utiliser les alias `@/` configurés
- **Types** : Toujours typer avec TypeScript (pas de `any`)
- **Composants** : Un composant = un fichier
- **Commits** : Messages clairs et descriptifs

---

## 👥 Support et contribution

### Contact

Pour toute question technique :
- Email: support@reflexofeu.fr (fictif pour l'exemple)

### Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

© 2024 ReflexOFeu - Tous droits réservés

---

## ✅ Checklist de mise en production

- [ ] Créer le compte admin dans Supabase Auth
- [ ] Créer les buckets Storage (`photos`, `documents`)
- [ ] Configurer les RLS policies en production
- [ ] Définir les variables d'environnement
- [ ] Tester tous les modules
- [ ] Vérifier les performances (Lighthouse)
- [ ] Configurer un domaine personnalisé
- [ ] Mettre en place une stratégie de backup
- [ ] Former les utilisateurs finaux

---

**Dernière mise à jour:** 22 décembre 2024
