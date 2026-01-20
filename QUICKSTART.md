# 🚀 Démarrage rapide - ReflexOFeu

## ⚡ Installation en 3 minutes

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration Supabase

#### A. Créer les buckets Storage

Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard

1. **Storage** → **New bucket**
   - Nom: `photos`
   - Public: ✅ Oui

2. **Storage** → **New bucket**
   - Nom: `documents`
   - Public: ✅ Oui

#### B. Créer le compte admin

1. **Authentication** → **Users** → **Add user**
   - Email: `admin@reflexofeu.fr`
   - Password: `admin123`
   - Confirm password: `admin123`
   - Click **Add user**

2. **Database** → **SQL Editor** → **New query**

   Exécutez cette requête pour donner le rôle admin :
   ```sql
   UPDATE profiles
   SET role = 'admin', full_name = 'Administrateur'
   WHERE email = 'admin@reflexofeu.fr';
   ```

### 3. Lancer l'application
```bash
npm run dev
```

🎉 **L'application est accessible sur http://localhost:3000**

---

## 🔑 Première connexion

**Email:** admin@reflexofeu.fr
**Mot de passe:** admin123

---

## 📖 Guide de démarrage

### Créer votre premier client

1. Cliquez sur **"CLIENTS"** dans la navigation
2. Cliquez sur **"Créer un client"**
3. Remplissez les informations :
   - Nom*
   - Adresse*
   - Code postal*
   - Ville*
   - Contact (optionnel)
   - Téléphone (optionnel)
   - Email (optionnel)
4. ✅ Cochez **"Multi site"** si le client a plusieurs sites
5. Si multi-site, cliquez sur **"Ajouter un site"** et remplissez :
   - Nom du site
   - Adresse
   - Code postal
   - Ville
6. Cliquez sur **"Valider"**

➡️ La carte à droite affichera automatiquement la localisation

### Créer un relevé d'étude

1. Allez sur **"RELEVÉ - ÉTUDE"**
2. Sélectionnez un **client** et un **site**
3. Remplissez les informations de l'armoire :
   - Nom armoire*
   - Zone
   - Hauteur, Longueur, Profondeur (le volume se calcule automatiquement)
   - Nb de cellules
   - Ventilation (oui/non)
   - Arrivée câbles (Haut/Bas)
4. Cliquez sur **"Ajouter"** dans le tableau **"CHOIX SYSTEME"**
   - Sélectionnez le modèle (RV0.5m3 à RV3m3)
   - Quantité
   - Tube
   - Température sprinkler (40°C à 93°C)
5. Ajoutez jusqu'à 5 photos
6. Cliquez sur **"Sauvegarder"**

### Faire une installation

1. Allez sur **"INSTALLATION"**
2. Sélectionnez le **client** et le **site**
3. Les données du relevé sont automatiquement préremplies
4. Modifiez si nécessaire
5. Cochez les options supplémentaires :
   - ✅ Sirène flash
   - ✅ Panneau
   - ✅ Contact NO/NF suppl.
6. Changez le **statut** en "En cours" ou "Fait"
7. Cliquez sur **"Sauvegarder"**

### Faire une vérification

1. Allez sur **"VÉRIFICATION"**
2. Sélectionnez le **client** et le **site**
3. Les données d'installation sont reprises
4. Ajoutez vos **commentaires** dans la zone de texte
5. Changez le **statut** en "Fait" quand terminé
6. Cliquez sur **"Sauvegarder"**

### Générer un rapport PDF

1. Allez sur **"RAPPORTS"**
2. Sélectionnez un **client**
3. (Optionnel) Sélectionnez un **site** spécifique
4. Cliquez sur **"Télécharger PDF"**
5. Le rapport complet (client + relevé + installation + vérification) est généré

### Visualiser la carte

1. Allez sur **"CARTE"**
2. Utilisez les filtres :
   - **Client** : filtre par client
   - **Ville** : recherche par ville
   - **Rayon** : 50/100/200 km
3. Cliquez sur les **markers** pour voir les détails

---

## 🎨 Modules disponibles

| Module | Description | Statut |
|--------|-------------|--------|
| **CLIENTS** | Gestion clients et sites | ✅ Opérationnel |
| **RELEVÉ - ÉTUDE** | Relevés techniques armoires | ✅ Opérationnel |
| **INSTALLATION** | Suivi installations | ✅ Opérationnel |
| **VÉRIFICATION** | Vérifications post-install | ✅ Opérationnel |
| **INFOS** | Documents et uploads | ✅ Opérationnel |
| **RAPPORTS** | Génération PDF | ✅ Opérationnel |
| **CARTE** | Visualisation cartographique | ✅ Opérationnel |

---

## 🛠️ Commandes utiles

```bash
# Lancer en développement
npm run dev

# Builder pour la production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint
```

---

## 📊 Structure de la base de données

```
clients
  └── sites
       └── armoires
            ├── releve_etudes
            │    ├── releve_systemes
            │    └── releve_photos
            ├── installations
            │    ├── installation_systemes
            │    └── installation_photos
            └── verifications
                 ├── verification_systemes
                 └── verification_photos
```

---

## ❓ FAQ

### Comment ajouter un utilisateur technicien ?

1. **Authentication** → **Users** → **Add user**
2. Email + mot de passe
3. Le profil est créé automatiquement avec rôle `technicien`

### Les photos ne s'uploadent pas

Vérifiez que les buckets `photos` et `documents` sont bien créés et **publics** dans Supabase Storage.

### La carte ne s'affiche pas

1. Vérifiez votre connexion internet (utilise OpenStreetMap)
2. Leaflet CSS doit être chargé dans `index.html`

### La géolocalisation ne fonctionne pas

L'API Nominatim (gratuite) a un rate limit. Si vous avez trop de requêtes, attendez quelques minutes.

### Comment déployer en production ?

```bash
# Option 1: Vercel (recommandé)
npm i -g vercel
vercel

# Option 2: Netlify
npm i -g netlify-cli
netlify deploy --prod

# Option 3: Build manuel
npm run build
# Uploadez /dist sur votre serveur
```

---

## 🔐 Sécurité

- ✅ RLS (Row Level Security) activé sur toutes les tables
- ✅ JWT tokens avec Supabase Auth
- ✅ Validation côté client et serveur
- ✅ Upload limité à 5 photos par relevé
- ✅ Types MIME validés

---

## 📞 Support

Pour toute question, consultez le **README.md** complet qui contient :
- Architecture détaillée
- Guide d'extension
- API complète
- Schéma de base de données détaillé
- Dépannage avancé

---

**Bon développement ! 🚀**
