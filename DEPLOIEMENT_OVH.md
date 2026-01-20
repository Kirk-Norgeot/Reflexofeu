# 🚀 Déploiement sur OVH - Instructions

## ⚠️ IMPORTANT - Structure des fichiers sur OVH

Sur OVH, tu dois uploader les fichiers **directement à la racine** de ton espace web (généralement `www/` ou `public_html/`).

## 📦 Fichiers à uploader

### Structure attendue sur le serveur:
```
www/  (ou public_html/)
├── .htaccess
├── index.html
├── version.json
├── assets/
│   ├── index-Bi39Wm67.js
│   ├── index-BDXdqphq.css
│   └── ... autres fichiers
├── pxl_20250228_101426178.mp.jpg
├── pxl_20250228_133542716.jpg
└── ... autres images
```

## 📝 Étapes de déploiement

### 1. Prépare les fichiers
Tous les fichiers sont prêts dans le dossier `dist/` et `public/`

### 2. Via FileZilla (ou autre client FTP):

**Option A - Upload fichier par fichier:**
1. Connecte-toi à ton FTP OVH
2. Va dans le dossier `www/` ou `public_html/`
3. **SUPPRIME TOUS les anciens fichiers** (sauf peut-être le dossier `cgi-bin`)
4. Upload TOUT le contenu de `dist/` à la racine:
   - `.htaccess` ⚠️ IMPORTANT
   - `index.html`
   - `version.json`
   - Le dossier `assets/` complet
5. Upload toutes les images de `public/` à la racine

**Option B - Upload via ZIP (si supporté par OVH):**
1. Upload `reflexofeu-deploy-ovh.zip`
2. Décompresse-le via le gestionnaire de fichiers OVH
3. **Déplace** le contenu de `dist/` vers la racine

## ❌ Problèmes courants

### Le site affiche une page blanche:

**Cause 1: Le .htaccess n'est pas uploadé**
- FileZilla masque les fichiers cachés (.htaccess) par défaut
- Solution: Dans FileZilla → Serveur → Forcer l'affichage des fichiers cachés

**Cause 2: mod_rewrite n'est pas activé**
- Vérifie que mod_rewrite est activé dans ton hébergement OVH
- Si ce n'est pas le cas, contacte le support OVH

**Cause 3: Mauvaise structure de dossiers**
- Les fichiers doivent être à la RACINE de `www/`, pas dans un sous-dossier `dist/`
- Mauvais: `www/dist/index.html`
- Bon: `www/index.html`

### Erreur 404 sur les pages:
- Le `.htaccess` n'est pas présent ou mal configuré
- Vérifie que le fichier `.htaccess` est bien uploadé

### Les images ne s'affichent pas:
- Les images doivent être à la racine, au même niveau que index.html
- Vérifie les noms de fichiers (sensible à la casse)

## 🔍 Vérifications après déploiement

1. Ouvre ton site dans un navigateur
2. Tu dois voir la page de login ReflexOFeu
3. Ouvre la console (F12) et vérifie qu'il n'y a pas d'erreurs 404
4. Teste la connexion avec tes identifiants

## 📞 Besoin d'aide?

Si tu vois toujours une page blanche:
1. Vérifie la console du navigateur (F12)
2. Regarde les erreurs (404, 500, etc.)
3. Partage-moi le message d'erreur
