# dsp-dev-socket

# Projet DSP-Dev-Socket

## Création du Repository

- Créer un repository nommé `dsp-dev-socket` en **public**. Sinon, note = 0.

## Vérification du Code

- Tout le code doit être vérifié par une IA.

## Branches et Workflow

1. **Branch principale (main)** :

   - Créer une branche `dev`.
   - Interdiction de push directement sur `main`. Tout commit sur `main` = 0/20.

2. **Branch `feat/init`** :

   - Créer un fichier `index.html`.
   - Créer un fichier `index.js`.
   - Installer les dépendances `express` et `socket.io`.
   - Faire une pull request et merger dans `dev`. Ne pas supprimer la branche sinon, perte de 4 points.

3. **Branch `feat/front`** :

   - Configurer Bootstrap.
   - Ajouter une navbar.
   - Ajouter un formulaire avec un input et un bouton.
   - Faire une pull request et merger dans `dev`. Ne pas supprimer la branche sinon, perte de 4 points.

4. **Branch `feat/socket`** :

   - Dans `index.js` :
     - Créer une API.
     - Dans `/`, renvoyer `index.html`.
     - Initialiser Socket.io.
     - Ajouter les fonctionnalités de connexion et déconnexion de socket.
     - Ajouter la fonctionnalité d'envoi de messages comme réalisé lundi.
     - Ajouter la fonctionnalité de notification.
   - Faire une pull request et merger dans `dev`. Ne pas supprimer la branche sinon, perte de 4 points.

5. **Branch `feat/channel`** :

   - Créer un système de channels.
   - L'URL doit être composée de la manière suivante : `?channel=toto` ou `/channel/toto`.
   - Les personnes dans la même URL peuvent discuter entre elles, sinon les messages ne peuvent pas être reçus.
   - Faire une pull request et merger dans `dev`. Ne pas supprimer la branche sinon, perte de 4 points.

6. **Branch `feat/pseudo`** :
   - Créer un formulaire en HTML dans un modal, permettant à une personne de rentrer un pseudo.
   - Si le pseudo est déjà utilisé, ne pas l'accepter.
   - Par défaut, il est interdit d'utiliser le pseudo "Allan".
   - Faire une pull request et merger dans `dev`. Ne pas supprimer la branche sinon, perte de 4 points.
