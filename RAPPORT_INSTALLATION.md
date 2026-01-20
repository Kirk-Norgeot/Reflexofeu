# Rapport d'Installation Professionnel ReflexOFeu

## Vue d'ensemble

Le système génère automatiquement un **rapport d'installation professionnel** au format PDF inspiré du modèle technique ReflexOFeu. Le rapport inclut :

- Un en-tête de marque avec logo et titre professionnel
- Des sections structurées avec checkboxes conformes aux standards
- Des informations techniques détaillées sur les composants
- Une liste complète des équipements protégés
- Un footer avec coordonnées légales de l'entreprise
- Une section signature client

## Structure du Rapport

### 1. En-tête de Marque

**Design professionnel** avec :
- Fond dégradé gris foncé (slate-700 à slate-900)
- Logo "ReflexOFeu" en blanc
- Sous-titre : "Documentation Technique - Systèmes d'Extinction FK-5-1-12"
- Slogan : "Détection extinction simple et efficace"

### 2. Section Titre Centrale

- Logo "ReflexOFeu" en grand format (avec O rouge)
- "Détection Extinction Incendie"
- "La meilleure solution pour vos armoires électriques"

### 3. Descriptifs des Installations

**Barre rouge à gauche** avec :
- Titre : "Descriptifs des installations"
- Type de système : "Système de détection extinction automatique modulaire"
- **Informations client (chargées automatiquement depuis la base de données)** :
  - **Client** : Nom complet du client
  - **Contact** : Personne de contact (si renseignée)
  - **Site** : Nom du site
  - **Adresse** : Adresse complète (rue, code postal, ville)
  - **Date de l'installation** : Date du jour (format : "28 décembre 2025")

### 4. Section 1 : Demande Formulée de Protection

Checkboxes pour :
- ☐ Armoire de commande
- ☑ TGBT (coché par défaut)
- ☐ Armoire condensateur
- ☐ Machine usinage CNC
- ☐ Stockage
- ☐ Divers

### 5. Section 2 : Éléments Fournis pour l'Étude

Checkboxes pour :
- ☐ Plans
- ☑ Dimensions (coché)
- ☑ Descriptions (coché)
- ☑ Photos (coché)

### 6. Section 3 : Agent Extincteur

- ☑ FK-5-1-12 (toujours coché)

### 7. Section 4 : Classe de Feu

Checkboxes pour :
- ☐ Classe A : Matériaux solides avec formation de braises
- ☑ Classe B : Feux de liquides - Feux d'origine électrique (coché)
- ☐ Classe C : Feux de gaz

### 8. Section 5 : Report d'Activation

**Texte informatif** :
"Tous les systèmes Reflexofeu sont équipés de pressostats afin de pouvoir activer la coupure d'énergie sur les armoires électriques, moteurs... Le client se doit de vérifier la possibilité de relayer cette information."

**Besoins complémentaires client** (checkboxes dynamiques basées sur l'installation) :
- ☑ Pressostat NO (si présent dans les systèmes)
- ☑ Pressostat supp. NF (si contact NF supplémentaire présent)
- ☐ Centrale technique

### 9. Section 7 : Principe d'Extinction Installé

**Texte descriptif** :
"Système de détection et extinction précoce sur armoire électrique. Double détection installée :
- Tête à déclenchement thermique à 68°C
- Tube de détection extinction installé au plus près des composants"

**Checkboxes** :
- ☑ FK-5-1-12 Agent extincteur
- ☑ Détection au plus près des composants
- ☑ Détection via module de détection thermique 68°C
- ☑ Sirène flash reliée au contact sec (si présent)

### 10. Section 8 : Matériel Proposé

**Description du système** avec certificat CE

**Composants détaillés** dans un encadré gris :

#### Cylindre en acier
- Pression de service : 14 bar
- Pression d'épreuve : 27 bar
- Température d'utilisation : -30°C / +60°C
- Support de fixation en acier peint

#### Vanne de décharge Inox 304
- Manomètre de contrôle visuel
- Valve Schraeder de pressurisation
- Connecteur avec soupape de contrôle
- Tube plongeur souple

#### Tube capillaire de détection
- Résistance température : 140°C
- Pression de service : 14 bar
- Rupture au contact flamme : 200°C
- Fixation par support adhésif/collier
- Presse étoupe IP64

#### Pressostat
- Certifié CE
- IP54
- Normalement ouvert en veille
- Contact sec fermé au déclenchement

#### Agent extincteur
- FK-5-1-12
- Azote N2
- Quantité selon configuration

### 11. Section 9 : Maintenance

- **Tous les 6 mois** : Vérification état extérieur, indicateur visuel zone verte
- **Tous les ans** : Vérification par l'installateur

### 12. Section 10 : Durée de Vie et Garantie

- 10 ans de validité pour le système
- 1 an de garantie fabricant

### 13. Liste des Équipements Protégés

Pour chaque armoire installée :

**Encadré gris avec bordure** contenant :
- **Nom de l'armoire**
- **Tableau d'informations** (4 colonnes) :
  - Type : Module X cellule(s)
  - Cylindres : Nombre total de cylindres
  - Volume : Volume en m³
  - Agent : Quantité d'agent en kg
- **Photo d'installation** (si disponible)

### 14. Footer Entreprise

**Informations légales centrées** :
- REFLEXOFEU - SASU au capital de 3000.00 €
- Adresse : L'érable 28250 Digny - France
- Siret : 84870209800015 - TVA : FR60848702098
- Site web et email en bleu : www.reflexofeu.fr / contact@reflexofeu.fr

**Logo centré** :
- "Reflex**O**Feu" (avec O en rouge)

### 15. Signature Client

**Processus de signature** :
1. L'utilisateur clique sur "Signer le rapport"
2. Un dialogue s'affiche demandant le nom et prénom de la personne qui signe
3. Après validation, le canvas de signature s'affiche
4. La signature est enregistrée avec le nom du signataire

**Affichage dans le rapport** :
- Titre : "Signature Client :"
- **Nom du signataire** : Nom et prénom de la personne qui a signé
- Cadre blanc avec bordure pour la signature
- Date et heure complète de signature

### 16. Copyright

**Pied de page** :
- "© 2024 Reflexofeu - Documentation Technique Système FK-5-1-12"
- "Document confidentiel - Usage réservé aux professionnels"

## Processus d'Utilisation

### Étape 1 : Installation

1. Accédez à la page **Installation**
2. Sélectionnez un **client** et un **site**
3. Choisissez un **relevé d'étude complété**
4. Pour chaque armoire :
   - Prenez au moins **1 photo** d'installation (obligatoire)
   - Cliquez sur **"Marquer comme installé"**

### Étape 2 : Finalisation

Une fois toutes les armoires installées :
1. Cliquez sur **"Finaliser et Signer"**
2. Vous êtes redirigé vers la page de rapport
3. Le rapport s'affiche avec toutes les sections pré-remplies

### Étape 3 : Signature

1. Cliquez sur **"Signer le rapport"**
2. **Dialogue de signature** :
   - Un dialogue s'affiche demandant le nom et prénom de la personne qui signe
   - Entrez le nom complet (ex: "Jean Dupont")
   - Cette personne doit être le contact client ou une personne autorisée
   - Cliquez sur **"Continuer"** (ou Entrée)
3. **Canvas de signature** :
   - Dessinez la signature sur l'écran tactile ou avec la souris
   - Cliquez sur **"Valider"** pour enregistrer
   - Possibilité d'effacer et recommencer
4. La signature apparaît dans le rapport avec :
   - Le nom du signataire
   - La signature elle-même
   - La date et heure exacte de signature

### Étape 4 : Export et Partage

Options disponibles :

**Télécharger PDF** :
- Génère un PDF haute qualité
- Nom : `rapport-installation-YYYY-MM-DD.pdf`

**Partager par Email** :
- Sur mobile : partage natif avec fichier PDF
- Sur desktop : télécharge + ouvre l'application email

**Partager via WhatsApp** :
- Sur mobile : partage natif avec fichier PDF
- Sur desktop : télécharge + ouvre WhatsApp Web

## Génération du PDF

### Technologies Utilisées

- **html2canvas** : Convertit le HTML en image
- **jsPDF** : Crée le document PDF
- **Qualité** : JPEG 85% avec compression
- **Format** : A4 Portrait
- **Pagination** : Automatique si contenu > 1 page

### Configuration CORS

Les images Supabase sont chargées avec `crossOrigin="anonymous"` pour permettre la conversion en PDF.

## Personnalisation Dynamique

### Données Client et Site Automatiques

Le rapport charge automatiquement les informations du client et du site depuis la base de données :

**Informations affichées** :
- **Nom du client** : Récupéré depuis la table `clients`
- **Contact client** : Personne de contact si renseignée
- **Nom du site** : Nom du site d'installation
- **Adresse complète** : Adresse du site (rue, code postal, ville)

**Avantages** :
- Aucune saisie manuelle nécessaire
- Données toujours à jour
- Cohérence avec la base de données
- Gain de temps lors de la génération

### Nom du Signataire

Avant de signer, le système demande obligatoirement :
- Le nom et prénom de la personne qui signe
- Cette information est stockée dans la base de données
- Affichée clairement dans le rapport final
- Permet la traçabilité complète

**Bonnes pratiques** :
- Utiliser le nom complet (prénom + nom)
- Vérifier l'orthographe avant validation
- Seules les personnes autorisées doivent signer
- Le contact client ou un responsable du site

### Checkboxes Dynamiques

Le rapport adapte automatiquement les checkboxes selon les données :

**Section 5 - Report d'activation** :
- Pressostat NO : Coché si au moins un système a `pressostat = true` et `pressostat_type = 'NO'`
- Pressostat NF : Coché si au moins un système a `contact_nf_suppl = true`

**Section 7 - Principe d'extinction** :
- Sirène flash : Coché si au moins un système a `sirene_flash = true`

### Calculs Automatiques

**Pour chaque équipement** :
- **Total cylindres** : Somme des quantités de tous les systèmes
- **Agent total** : Somme du volume de chaque système × quantité (en kg)

Exemple :
- Système 1.5m³ × 2 = 3 kg
- Système 1m³ × 1 = 1 kg
- **Total agent = 4 kg**

## Bonnes Pratiques

### Photos

✅ **À faire** :
- Prendre des photos claires et bien cadrées
- Inclure au moins 1 photo par armoire
- Capturer les systèmes installés visibles

❌ **À éviter** :
- Photos floues ou mal éclairées
- Photos trop éloignées
- Oublier de prendre des photos

### Informations Client

Avant de générer le rapport, vérifiez :
- Les dimensions des armoires sont correctes
- Le nombre de cellules est renseigné
- Le volume est calculé
- La zone est définie si applicable

### Signature

⚠️ **Important** :
- Ne signer qu'après vérification complète du rapport
- La signature est horodatée automatiquement
- Une seule signature par installation/site

### Partage

**Recommandations** :
- Privilégier le PDF pour une meilleure qualité
- Vérifier le PDF avant envoi au client
- Conserver une copie locale si nécessaire

## Stockage des Données

### Base de Données

- **Installations** : Table `installations`
- **Systèmes** : Table `installation_systemes`
- **Photos** : Table `installation_photos`
- **Signatures** : Table `signatures_installation`

### Storage Supabase

- **Photos** : Bucket `installation-photos`
- **Format** : JPEG avec compression
- **Accès** : Public avec CORS activé

## Dépannage

### Le PDF ne se génère pas

**Causes possibles** :
- Photos non chargées (vérifier connexion)
- Erreur CORS sur les images
- Navigateur incompatible

**Solutions** :
- Actualiser la page
- Vérifier que les images sont accessibles
- Tester dans un autre navigateur

### Les checkboxes ne s'affichent pas correctement

**Cause** :
- Données manquantes dans la base

**Solution** :
- Vérifier que les systèmes ont bien leurs attributs renseignés
- Recréer l'installation si nécessaire

### La signature n'apparaît pas dans le PDF

**Causes** :
- Signature non enregistrée
- Erreur lors de la sauvegarde

**Solutions** :
- Re-signer le rapport
- Vérifier les logs de la console
- Vérifier la table `signatures_installation`

## Format Technique

### Couleurs

- **Gris foncé** : `slate-700` à `slate-900` (en-tête)
- **Rouge accent** : `red-600` (barre latérale, logo)
- **Bleu liens** : `blue-600` (URLs)
- **Gris texte** : `slate-700` (texte principal)
- **Gris clair** : `gray-50` (encadrés)

### Typographie

- **Titres principaux** : `text-3xl font-bold`
- **Titres sections** : `text-lg font-bold underline`
- **Texte normal** : `text-sm`
- **Détails techniques** : `text-xs`

### Espacements

- **Sections principales** : `mb-8` (2rem)
- **Sous-sections** : `mb-4` (1rem)
- **Éléments liste** : `space-y-2` (0.5rem)

## Améliorations Futures Possibles

- Export en plusieurs formats (Word, Excel)
- Email automatique au client après signature
- Signature multiple (client + technicien)
- QR code pour traçabilité et vérification
- Historique des versions du rapport
- Personnalisation du logo et des couleurs
- Ajout de sections personnalisables
- Intégration avec systèmes CRM
- Génération de rapports groupés par période
- Statistiques d'installations par client/période
