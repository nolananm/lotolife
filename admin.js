<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - LotoLife</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="admin-header">
        <h1>🎪 LotoLife Admin - Création de Salle</h1>
    </header>
    
    <main>
        <section class="card">
            <h2>1. Configuration de la Salle</h2>
            <input type="text" id="venueName" placeholder="Nom de la salle (ex: Salle des Fêtes de Brive)" style="width: 100%; max-width: 400px;">
            
            <div style="margin-top: 1rem;">
                <label>Lignes : <input type="number" id="gridRows" value="10" min="1"></label>
                <label>Colonnes : <input type="number" id="gridCols" value="15" min="1"></label>
                <button id="generateGridBtn">Générer le plan vide</button>
            </div>
        </section>

        <section class="card">
            <h2>2. Dessiner le Plan (Façon Ticketmaster)</h2>
            <p>Clique sur la grille pour placer ou retirer une chaise. (Rouge = Place active, Gris = Vide)</p>
            <div id="seatGrid" class="seat-grid"></div>
            <button id="saveVenueBtn" style="margin-top: 1rem; width: 100%; padding: 1rem; font-size: 1.1rem;">Enregistrer la salle et les places</button>
        </section>
    </main>

    <script type="module" src="admin.js"></script>
</body>
</html>
