# Configuration des Photos - Supabase Storage

## Vérification du bucket de photos

Pour que les photos s'affichent correctement, le bucket Supabase Storage doit être configuré.

### 1. Vérifier que le bucket existe

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Cliquez sur "Storage" dans le menu latéral
3. Vérifiez qu'un bucket nommé **`releve-photos`** existe

### 2. Créer le bucket si nécessaire

Si le bucket n'existe pas :

1. Cliquez sur "New bucket"
2. Nom : `releve-photos`
3. Public : **Cochez "Public bucket"** (pour que les photos soient accessibles)
4. Cliquez sur "Create bucket"

### 3. Configuration des politiques RLS

Le bucket doit avoir les bonnes politiques pour :
- Permettre aux utilisateurs authentifiés d'uploader des photos
- Permettre à tous de voir les photos (ou seulement aux utilisateurs authentifiés)

#### Politiques recommandées :

**Pour l'upload (INSERT)** :
```sql
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'releve-photos');
```

**Pour la lecture (SELECT)** :

Option A - Public (recommandé pour simplicité) :
```sql
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'releve-photos');
```

Option B - Authentifié uniquement :
```sql
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'releve-photos');
```

**Pour la suppression (DELETE)** :
```sql
CREATE POLICY "Authenticated users can delete their photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'releve-photos');
```

### 4. Vérifier la configuration

Pour vérifier que tout fonctionne :

1. Créez un nouveau relevé avec une photo
2. Ouvrez la console développeur (F12)
3. Allez dans l'onglet "Réseau"
4. Vérifiez si vous voyez une requête vers Supabase Storage
5. Si la requête échoue, regardez le code d'erreur :
   - **403 Forbidden** : Problème de politiques RLS
   - **404 Not Found** : Le bucket n'existe pas ou l'URL est incorrecte
   - **CORS error** : Problème de configuration CORS

### 5. Configuration CORS (si nécessaire)

Si vous avez des erreurs CORS, vérifiez que :
1. Le bucket est bien public OU
2. Les politiques RLS permettent l'accès

Normalement, Supabase gère automatiquement le CORS pour les buckets publics.

## Tester les photos

### Test simple :

1. Créez un nouveau relevé
2. Ajoutez une photo via l'appareil ou uploadez un fichier
3. Sauvegardez le relevé
4. Allez dans "Liste des relevés à signer"
5. Sélectionnez le client et le site
6. Vérifiez que la photo s'affiche dans la liste

### Test via console :

Vous pouvez aussi tester directement dans Supabase :

1. Allez dans Storage > releve-photos
2. Uploadez manuellement une image de test
3. Cliquez dessus pour obtenir l'URL publique
4. Copiez l'URL dans votre navigateur
5. Si l'image s'affiche → Configuration OK
6. Si erreur 403 → Problème de politiques

## Debug des photos manquantes

### Photos ne s'affichent pas dans la liste :

1. Ouvrez la console développeur (F12)
2. Cherchez les erreurs dans l'onglet Console
3. Vérifiez l'onglet Réseau pour voir si les requêtes d'images échouent

### Photos ne s'affichent pas dans le PDF :

Le PDF utilise les mêmes URLs que la liste, donc :
1. Si ça marche dans la liste, ça doit marcher dans le PDF
2. Si ça ne marche ni dans la liste ni dans le PDF → Problème de configuration Storage
3. Si ça marche dans la liste mais pas dans le PDF → Problème de génération PDF (autre sujet)

## Compression des photos

Les photos sont automatiquement compressées :
- **Maximum 1920x1920 pixels**
- **Maximum 1 Mo** par photo
- Format JPEG avec qualité ajustée

Cela réduit :
- Le temps d'upload
- L'espace de stockage
- La taille des PDFs

## Structure de la base de données

Les photos sont stockées dans deux endroits :

1. **Supabase Storage** : Les fichiers image physiques (bucket `releve-photos`)
2. **Table `releve_photos`** : Les métadonnées (releve_etude_id, url_photo, position)

Quand vous créez un relevé avec photo :
1. La photo est uploadée vers Storage → Retourne une URL
2. L'URL est sauvegardée dans la table `releve_photos`
3. L'affichage charge les photos depuis la table et utilise les URLs pour les afficher
