# 📥 Accès à l'Import de Clients

## ✅ Fonctionnalité intégrée !

L'import de clients depuis Excel est maintenant **directement intégré dans l'application**.

## 🔗 Comment accéder à l'import

### Méthode 1 : Depuis la page Clients (Recommandé)
1. Connectez-vous à l'application
2. Allez dans **"Clients"** dans le menu
3. Cliquez sur le bouton **"Importer Excel"** en haut à droite
4. Vous serez redirigé vers la page d'import

### Méthode 2 : URL directe
Accédez directement à : `https://votre-site.com/clients/import`

## 📋 Comment importer vos clients

1. **Sélectionnez votre fichier Excel**
   - Glissez-déposez le fichier dans la zone prévue
   - OU cliquez sur "Choisir un fichier"

2. **Vérifiez les données**
   - Un tableau s'affiche avec tous les clients trouvés
   - Les clients valides sont automatiquement sélectionnés
   - Statistiques en temps réel :
     - Clients trouvés
     - Clients sélectionnés
     - Clients valides (avec toutes les données obligatoires)

3. **Sélection des clients**
   - Cochez/décochez individuellement les clients
   - Utilisez "Tout sélectionner" ou "Tout désélectionner"
   - Seuls les clients avec nom, adresse, code postal et ville sont importables

4. **Lancez l'import**
   - Cliquez sur "Importer X client(s)"
   - Une barre de progression s'affiche
   - Les résultats s'affichent à la fin :
     - ✅ Nombre de clients importés
     - ⚠️ Liste des erreurs éventuelles (doublons, données manquantes)

5. **Retour automatique**
   - Après un import réussi, vous êtes redirigé vers la page Clients
   - Vos nouveaux clients apparaissent dans la liste

## 🚨 Gestion des erreurs

### Affichage détaillé des erreurs

Si certains clients n'ont pas pu être importés, un tableau détaillé s'affiche automatiquement avec :
- **Nom du client** qui n'a pas pu être importé
- **Raison de l'erreur** (données manquantes, doublon, etc.)

### Types d'erreurs courants :
- ❌ **"Données obligatoires manquantes"** → Il manque le nom, l'adresse, le code postal ou la ville
- ❌ **"Client déjà existant"** → Un client avec le même nom existe déjà dans la base
- ❌ **"Erreur inconnue"** → Problème technique lors de l'import

### Télécharger la liste des erreurs

Un bouton **"Télécharger la liste"** vous permet d'exporter un fichier Excel contenant :
- Tous les clients qui n'ont pas pu être importés
- La raison de chaque erreur

Vous pouvez ensuite :
1. Corriger les erreurs dans le fichier téléchargé
2. Réimporter uniquement les clients corrigés

## 📊 Format du fichier Excel

### Colonnes reconnues :
- **Raison sociale** ou **Client** → Nom du client (obligatoire)
- **Adresse** → Adresse (obligatoire)
- **Code postal** → Code postal (obligatoire)
- **Ville** → Ville (obligatoire)
- **Adresse complémentaire** → Adresse 2 (optionnel)
- **Téléphone** ou **Mobile** → Téléphone (optionnel)
- **Email** → Email (optionnel)

### Exemple de structure :
```
Raison sociale | Adresse              | Code postal | Ville    | Téléphone    | Email
ABC ENTREPRISE | 10 rue de la Paix    | 75001      | Paris    | 0123456789   | contact@abc.fr
XYZ SARL       | 25 avenue Victor Hugo| 69000      | Lyon     | 0987654321   | info@xyz.fr
```

## ⚠️ Validation des données

### Données obligatoires :
- ✅ Nom du client
- ✅ Adresse
- ✅ Code postal
- ✅ Ville

### Gestion des erreurs :
- **Clients en doublon** : Signalés mais n'empêchent pas l'import des autres
- **Données manquantes** : Les clients incomplets sont automatiquement désélectionnés
- **Erreurs d'import** : Un rapport détaillé est affiché à la fin

## 🔐 Sécurité

- ✅ Authentification requise
- ✅ Chaque client importé est lié à votre compte
- ✅ Validation des données côté serveur
- ✅ Edge Function sécurisée avec Supabase

## 💡 Conseils

1. **Préparez votre fichier Excel**
   - Assurez-vous que les noms de colonnes correspondent
   - Vérifiez qu'il n'y a pas de lignes vides au milieu
   - Les codes postaux doivent être au format texte

2. **Import par lots**
   - Si vous avez beaucoup de clients, vous pouvez importer par lots
   - Sélectionnez seulement une partie à la fois

3. **Vérification après import**
   - Vérifiez quelques clients pour vous assurer que les données sont correctes
   - Les clients sont immédiatement disponibles dans l'application

4. **Gestion des doublons**
   - Si un client existe déjà, il ne sera pas importé
   - Vous verrez ce client dans la liste des erreurs avec la mention "Client déjà existant"
   - Téléchargez la liste des erreurs pour identifier facilement les doublons

5. **Correction des erreurs**
   - Téléchargez la liste des clients non importés
   - Corrigez les données manquantes ou erronées
   - Réimportez uniquement les clients corrigés

## 🎯 Exemple de fichier fourni

Le fichier Excel que vous avez fourni (`export_des_clients-reflexofeu-14.01.2026.xls`) contient environ **500+ clients** et est compatible avec l'outil d'import.

---

**L'import de clients est maintenant entièrement intégré à l'application ! 🎉**
