import { supabase } from './supabase.js';

const venueNameInput = document.getElementById('venueName');
const tableNameInput = document.getElementById('tableNameInput');
const tableSeatsInput = document.getElementById('tableSeatsInput');
const addTableBtn = document.getElementById('addTableBtn');
const roomPlan = document.getElementById('roomPlan');
const saveVenueBtn = document.getElementById('saveVenueBtn');

let tables = [];

// Fonction pour dessiner le plan
function renderPlan() {
    roomPlan.innerHTML = '';
    
    if (tables.length === 0) {
        roomPlan.innerHTML = '<p style="color: #666; font-style: italic;">Le plan est vide. Ajoute une table ci-dessus.</p>';
        return;
    }

    tables.forEach((table, index) => {
        const tableGroup = document.createElement('div');
        tableGroup.classList.add('loto-table-group');

        // Ligne du haut (Moitié des chaises)
        const topRow = document.createElement('div');
        topRow.classList.add('loto-chair-row');
        const halfSeats = Math.ceil(table.seats / 2);
        
        for(let i = 1; i <= halfSeats; i++) {
            const chair = document.createElement('div');
            chair.classList.add('chair');
            chair.textContent = i;
            topRow.appendChild(chair);
        }

        // La table elle-même
        const tableSurface = document.createElement('div');
        tableSurface.classList.add('loto-table-surface');
        tableSurface.textContent = table.name;
        // Ajuste la largeur de la table en fonction du nombre de chaises
        tableSurface.style.width = `${halfSeats * 45}px`; 

        // Ligne du bas (L'autre moitié)
        const bottomRow = document.createElement('div');
        bottomRow.classList.add('loto-chair-row');
        
        for(let i = halfSeats + 1; i <= table.seats; i++) {
            const chair = document.createElement('div');
            chair.classList.add('chair');
            chair.textContent = i;
            bottomRow.appendChild(chair);
        }

        // Bouton supprimer
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-table-btn');
        deleteBtn.textContent = 'X';
        deleteBtn.onclick = () => {
            tables.splice(index, 1);
            renderPlan();
        };

        tableGroup.appendChild(topRow);
        tableGroup.appendChild(tableSurface);
        tableGroup.appendChild(bottomRow);
        tableGroup.appendChild(deleteBtn);

        roomPlan.appendChild(tableGroup);
    });
}

// Ajouter une table
addTableBtn.addEventListener('click', () => {
    const name = tableNameInput.value.trim();
    const seats = parseInt(tableSeatsInput.value);

    if (!name) {
        alert('Donne un nom à la table !');
        return;
    }

    tables.push({ name: name, seats: seats });
    
    // Reset de l'input pour la prochaine table
    let nextTableChar = String.fromCharCode(name.charCodeAt(0) + 1);
    if(name.length > 1) nextTableChar = 'Table'; // Fallback simple
    tableNameInput.value = ''; 
    
    renderPlan();
});

// Sauvegarder dans Supabase
saveVenueBtn.addEventListener('click', async () => {
    const venueName = venueNameInput.value.trim();
    if (!venueName) {
        alert('Veuillez entrer un nom de salle !');
        return;
    }
    if (tables.length === 0) {
        alert('Ajoutez au moins une table au plan !');
        return;
    }

    try {
        saveVenueBtn.textContent = 'Enregistrement en cours...';
        saveVenueBtn.disabled = true;

        // 1. Créer la salle
        const { data: venueData, error: venueError } = await supabase
            .from('venues')
            .insert([{ name: venueName }])
            .select()
            .single();

        if (venueError) throw venueError;
        const venueId = venueData.id;

        // 2. Préparer toutes les places de toutes les tables
        const seatsToInsert = [];
        
        tables.forEach((table, tableIndex) => {
            for (let i = 1; i <= table.seats; i++) {
                seatsToInsert.push({
                    venue_id: venueId,
                    row_name: table.name, // On utilise row_name pour stocker le nom de la table
                    seat_number: i,
                    x_coord: i, // On garde des coordonnées simples pour l'ordre
                    y_coord: tableIndex, 
                    is_active: true
                });
            }
        });

        // 3. Envoyer les places (Batch insert)
        const { error: seatsError } = await supabase
            .from('seats')
            .insert(seatsToInsert);

        if (seatsError) throw seatsError;

        alert('🎪 Succès ! La salle et ses tables ont été enregistrées.');
        tables = [];
        venueNameInput.value = '';
        renderPlan();
        
    } catch (error) {
        console.error('Erreur Supabase:', error.message);
        alert('Erreur lors de l\'enregistrement. Vérifie la console.');
    } finally {
        saveVenueBtn.textContent = '💾 Enregistrer la salle et son plan';
        saveVenueBtn.disabled = false;
    }
});

renderPlan();
