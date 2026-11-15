import { supabase } from './supabase.js';

const venueSelect = document.getElementById('venueSelect');
const eventForm = document.getElementById('eventForm');
const categoriesSection = document.getElementById('categoriesSection');
const currentEventTitle = document.getElementById('currentEventTitle');
const currentEventId = document.getElementById('currentEventId');
const categoryForm = document.getElementById('categoryForm');
const categoriesList = document.getElementById('categoriesList');

// 1. Récupérer les salles depuis Supabase au chargement
async function loadVenues() {
    const { data, error } = await supabase.from('venues').select('id, name');
    if (error) {
        console.error('Erreur chargement salles:', error);
        venueSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        return;
    }
    
    venueSelect.innerHTML = '<option value="">-- Choisir une salle --</option>';
    data.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue.id;
        option.textContent = venue.name;
        venueSelect.appendChild(option);
    });
}
loadVenues();

// 2. Création de l'événement
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newEvent = {
        title: document.getElementById('eventTitle').value,
        venue_id: venueSelect.value,
        date_event: document.getElementById('eventDate').value,
        sales_open_date: document.getElementById('salesOpen').value,
        sales_close_date: document.getElementById('salesClose').value,
        card_price: parseFloat(document.getElementById('cardPrice').value),
        is_published: true
    };

    const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

    if (error) {
        alert('Erreur lors de la création du loto');
        console.error(error);
        return;
    }

    alert('Loto créé avec succès ! Tu peux maintenant ajouter des catégories de places.');
    
    // Afficher la zone des catégories
    categoriesSection.style.display = 'block';
    currentEventId.value = data.id;
    currentEventTitle.textContent = data.title;
    
    // On désactive le formulaire de base pour éviter les doublons
    eventForm.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
});

// 3. Ajout des catégories
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newCategory = {
        event_id: currentEventId.value,
        name: document.getElementById('catName').value,
        color_hex: document.getElementById('catColor').value,
        price_supplement: parseFloat(document.getElementById('catPrice').value)
    };

    const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();

    if (error) {
        alert('Erreur lors de l\'ajout de la catégorie');
        console.error(error);
        return;
    }

    // Affichage visuel dans la liste
    const li = document.createElement('li');
    li.style.marginBottom = '10px';
    li.style.padding = '10px';
    li.style.backgroundColor = 'white';
    li.style.borderLeft = `5px solid ${data.color_hex}`;
    li.style.borderRadius = '4px';
    li.innerHTML = `<strong>${data.name}</strong> - Supplément: ${data.price_supplement}€`;
    
    categoriesList.appendChild(li);
    
    // Reset juste le nom et le prix (garde la couleur par défaut)
    document.getElementById('catName').value = '';
    document.getElementById('catPrice').value = '0';
});
