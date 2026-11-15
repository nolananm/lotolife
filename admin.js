import { supabase } from './supabase.js';

const gridRowsInput = document.getElementById('gridRows');
const gridColsInput = document.getElementById('gridCols');
const generateGridBtn = document.getElementById('generateGridBtn');
const seatGrid = document.getElementById('seatGrid');
const saveVenueBtn = document.getElementById('saveVenueBtn');
const venueNameInput = document.getElementById('venueName');

let currentGrid = [];

generateGridBtn.addEventListener('click', () => {
    const rows = parseInt(gridRowsInput.value);
    const cols = parseInt(gridColsInput.value);
    
    seatGrid.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    seatGrid.innerHTML = '';
    currentGrid = [];

    for (let r = 0; r < rows; r++) {
        const rowArray = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('seat-cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // Logique pour activer/désactiver une place
            cell.addEventListener('click', function() {
                this.classList.toggle('active');
                rowArray[c] = this.classList.contains('active') ? 1 : 0;
            });

            seatGrid.appendChild(cell);
            rowArray.push(0);
        }
        currentGrid.push(rowArray);
    }
});

saveVenueBtn.addEventListener('click', async () => {
    const venueName = venueNameInput.value.trim();
    if (!venueName) {
        alert('Veuillez entrer un nom de salle !');
        return;
    }

    try {
        saveVenueBtn.textContent = 'Enregistrement en cours...';
        saveVenueBtn.disabled = true;

        // 1. Création de la salle (Venue)
        const { data: venueData, error: venueError } = await supabase
            .from('venues')
            .insert([{ name: venueName }])
            .select()
            .single();

        if (venueError) throw venueError;

        const venueId = venueData.id;
        const seatsToInsert = [];
        const rows = currentGrid.length;
        const cols = currentGrid[0].length;

        // 2. Traduction de la grille visuelle pour la base de données
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (currentGrid[r][c] === 1) {
                    seatsToInsert.push({
                        venue_id: venueId,
                        row_name: String.fromCharCode(65 + r), // Génère les lettres A, B, C...
                        seat_number: c + 1,
                        x_coord: c,
                        y_coord: r,
                        is_active: true
                    });
                }
            }
        }

        if (seatsToInsert.length === 0) {
            alert('Salle créée, mais aucune place n\'a été ajoutée au plan.');
            saveVenueBtn.textContent = 'Enregistrer la salle et les places';
            saveVenueBtn.disabled = false;
            return;
        }

        // 3. Insertion de toutes les places d'un coup (Batch insert)
        const { error: seatsError } = await supabase
            .from('seats')
            .insert(seatsToInsert);

        if (seatsError) throw seatsError;

        alert('Succès ! La salle et le plan ont été enregistrés.');
        
    } catch (error) {
        console.error('Erreur Supabase:', error.message);
        alert('Erreur lors de l\'enregistrement. Vérifie la console.');
    } finally {
        saveVenueBtn.textContent = 'Enregistrer la salle et les places';
        saveVenueBtn.disabled = false;
    }
});

// Génère une grille vide au chargement de la page
generateGridBtn.click();
