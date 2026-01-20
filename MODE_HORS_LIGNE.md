# Mode Hors Ligne - ReflexOFeu

## Fonctionnement

L'application ReflexOFeu supporte maintenant le **mode hors ligne** pour la collecte de données terrain, spécialement pour les relevés études et les photos.

### Caractéristiques

- **Détection automatique** : L'application détecte automatiquement quand vous perdez ou retrouvez la connexion internet
- **Stockage local** : Les données et photos sont sauvegardées localement dans le navigateur (IndexedDB)
- **Synchronisation automatique** : Dès que la connexion revient, les données sont automatiquement envoyées vers le serveur
- **Compression des photos** : Les photos sont automatiquement compressées à 1 Mo maximum pour optimiser la synchronisation

### Interface

#### Barre de statut
Une barre colorée en haut de l'écran indique l'état de connexion :

- **Bleue "En ligne"** : Connexion active, synchronisation possible
- **Orange "Hors ligne"** : Pas de connexion, les données sont sauvegardées localement
- **Affichage des données en attente** : Nombre de relevés en attente de synchronisation
- **Bouton "Synchroniser"** : Permet de forcer la synchronisation manuellement

### Utilisation sur le terrain

1. **Collecte hors connexion** :
   - Ouvrez l'application même sans connexion
   - Remplissez vos relevés études normalement
   - Prenez des photos avec l'appareil
   - Les données sont sauvegardées automatiquement dans le navigateur

2. **Retour en connexion** :
   - L'application détecte automatiquement le retour de connexion
   - La synchronisation démarre automatiquement après 1 seconde
   - Vous voyez une notification "Synchronisation..." pendant l'envoi
   - Une fois terminé, vous voyez "X relevé(s) synchronisé(s)"

3. **Synchronisation manuelle** :
   - Si besoin, cliquez sur le bouton "Synchroniser" dans la barre de statut
   - Utile si vous voulez vérifier l'état de la synchronisation

### Limitations et Notes

- Les photos sont comprimées à maximum 1920x1920 pixels et 1 Mo
- La qualité JPEG est ajustée automatiquement pour respecter la limite de taille
- Les données restent dans le navigateur jusqu'à leur synchronisation
- **Important** : Ne videz pas le cache du navigateur avant la synchronisation, vous perdriez les données locales

### Compatibilité Android

**Note importante** : L'application actuelle est une **Progressive Web App (PWA)** et non une application Android native (APK).

- Elle fonctionne dans le navigateur web (Chrome, Firefox, etc.)
- Elle peut être ajoutée à l'écran d'accueil comme une app
- Le mode hors ligne fonctionne dans le navigateur mobile
- Pour une vraie APK avec installation native, il faudrait convertir l'application avec Capacitor ou React Native

### Stockage des données

Les données hors ligne sont stockées dans :
- **IndexedDB** du navigateur
- Base de données locale : `ReflexoFeuOffline`
- Tables : `relevesEtudes` et `photos`

### Sécurité

- Les données locales sont isolées par domaine (sécurité navigateur)
- La synchronisation utilise l'authentification Supabase existante
- Les données sont supprimées du stockage local après synchronisation réussie

### Dépannage

Si la synchronisation ne fonctionne pas :
1. Vérifiez votre connexion internet
2. Rechargez la page
3. Cliquez sur "Synchroniser" manuellement
4. Vérifiez la console développeur pour les erreurs (F12)

Si vous perdez des données :
- Les données restent dans IndexedDB même après fermeture du navigateur
- Ne videz pas le cache navigateur
- Contactez l'administrateur si les données ne se synchronisent pas après plusieurs tentatives
