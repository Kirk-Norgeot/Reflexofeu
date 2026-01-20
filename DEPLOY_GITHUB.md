# 🚀 Guide Déploiement GitHub Pages

## Étape 1️⃣ : Créer le dépôt GitHub

1. Va sur [github.com](https://github.com)
2. Clique sur "New repository" (bouton vert en haut à droite)
3. Choisis un nom (exemple : `reflexofeu`)
4. Public ou Privé (les deux fonctionnent)
5. **NE COCHE PAS** "Add a README file"
6. Clique sur "Create repository"

## Étape 2️⃣ : Pousser le code sur GitHub

Dans ton terminal, à la racine du projet :

```bash
# Initialise git si ce n'est pas déjà fait
git init

# Ajoute tous les fichiers
git add .

# Crée ton premier commit
git commit -m "Premier commit - Reflexofeu"

# Ajoute l'origine GitHub (remplace TON_USERNAME et TON_REPO)
git remote add origin https://github.com/TON_USERNAME/TON_REPO.git

# Crée la branche main
git branch -M main

# Pousse le code
git push -u origin main
```

## Étape 3️⃣ : Configurer les secrets Supabase

1. Sur GitHub, va dans ton repo
2. Clique sur **Settings** (onglet en haut)
3. Dans le menu latéral gauche : **Secrets and variables** → **Actions**
4. Clique sur **New repository secret**
5. Ajoute ces 2 secrets :

**Secret 1 :**
- Name : `VITE_SUPABASE_URL`
- Value : `https://xxxxxxxxx.supabase.co` (ton URL Supabase du fichier .env)

**Secret 2 :**
- Name : `VITE_SUPABASE_ANON_KEY`
- Value : `eyJhbGciOi...` (ta clé anon Supabase du fichier .env)

## Étape 4️⃣ : Activer GitHub Pages

1. Toujours dans **Settings**
2. Dans le menu latéral : **Pages**
3. Sous **Source**, choisis : **GitHub Actions**
4. C'est tout ! ✅

## Étape 5️⃣ : Premier déploiement

Le déploiement se lance automatiquement ! 🎉

1. Va dans l'onglet **Actions** de ton repo
2. Tu verras le workflow "Deploy to GitHub Pages" en cours
3. Attends 2-3 minutes que ça devienne vert ✅
4. Clique sur le workflow, puis sur "deploy" pour voir l'URL

**Ton site sera accessible sur :**
```
https://TON_USERNAME.github.io/TON_REPO/
```

---

## 🌐 BONUS : Ajouter un nom de domaine personnalisé

### Option A : Domaine principal (exemple : reflexofeu.com)

**Chez ton registrar (OVH, Gandi, etc.) :**

Ajoute ces 4 enregistrements DNS de type **A** :

```
@    A    185.199.108.153
@    A    185.199.109.153
@    A    185.199.110.153
@    A    185.199.111.153
```

**Sur GitHub :**

1. Settings → Pages
2. Dans **Custom domain**, tape : `reflexofeu.com`
3. Clique sur Save
4. Attends quelques minutes, coche **Enforce HTTPS**

**Crée le fichier CNAME :**

Crée un fichier `/public/CNAME` avec juste :
```
reflexofeu.com
```

### Option B : Sous-domaine (exemple : app.reflexofeu.com)

**Chez ton registrar :**

Ajoute un enregistrement **CNAME** :

```
app    CNAME    TON_USERNAME.github.io.
```

**Sur GitHub :**

1. Settings → Pages
2. Dans **Custom domain**, tape : `app.reflexofeu.com`
3. Clique sur Save
4. Attends quelques minutes, coche **Enforce HTTPS**

**Crée le fichier CNAME :**

Crée un fichier `/public/CNAME` avec juste :
```
app.reflexofeu.com
```

### Attends la propagation DNS

- Ça peut prendre de **10 minutes à 24 heures**
- Tu peux vérifier avec : `nslookup ton-domaine.com`

---

## 🔄 Mises à jour automatiques

À partir de maintenant, chaque fois que tu fais :

```bash
git add .
git commit -m "Description de tes modifications"
git push
```

Le site se met à jour automatiquement en 2-3 minutes ! 🚀

---

## 📱 Vérifier le déploiement

1. Va dans **Actions** sur GitHub
2. Clique sur le dernier workflow
3. Si c'est vert ✅ → tout est bon !
4. Si c'est rouge ❌ → clique dessus pour voir l'erreur

---

## ✅ Checklist finale

- [ ] Code poussé sur GitHub
- [ ] Secrets Supabase configurés (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY)
- [ ] GitHub Pages activé (Source: GitHub Actions)
- [ ] Premier déploiement réussi (vert dans Actions)
- [ ] Site accessible sur l'URL GitHub Pages
- [ ] (Optionnel) Domaine personnalisé configuré

---

## 🆘 En cas de problème

**Le build échoue ?**
- Vérifie que les secrets Supabase sont bien configurés
- Regarde les logs dans Actions pour voir l'erreur exacte

**Le site ne charge pas ?**
- Attends 5 minutes après le premier déploiement
- Vérifie que GitHub Pages est bien activé (Source: GitHub Actions)
- Vide le cache de ton navigateur (Ctrl+Shift+R)

**Erreur 404 sur les routes ?**
- Le fichier `public/404.html` doit être présent
- Vide le cache et recharge

**Le domaine personnalisé ne marche pas ?**
- Vérifie la propagation DNS : https://www.whatsmydns.net
- Attends jusqu'à 24h pour la propagation
- Vérifie que le fichier CNAME est bien dans `/public/`
