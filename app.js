import { supabase } from './supabase.js';

const displayEventTitle = document.getElementById('displayEventTitle');
const displayEventDate = document.getElementById('displayEventDate');
const countdownArea = document.getElementById('countdownArea');
const countdownTimer = document.getElementById('countdownTimer');
const reservationArea = document.getElementById('reservationArea');
const displayCardPrice = document.getElementById('displayCardPrice');
const clientSeatGrid = document.getElementById('clientSeatGrid');
const cartonCountInput = document.getElementById('cartonCount');
const snackSelect = document.getElementById('snackSelect');
const totalPriceDisplay = document.getElementById('totalPrice');
const bookingForm = document.getElementById('bookingForm');

let currentEvent = null;
let availableSeats = [];
let selectedSeats = [];
let bookedSeatIds = []; 
let timerInterval = null;

// 1. Charger l'événement, la salle et les places
async function loadEvent() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        displayEventTitle.textContent = "Aucun loto sélectionné ! Retourne à l'accueil.";
        return;
    }

    // Récupérer le Loto
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (eventError || !eventData) {
        displayEventTitle.textContent = "Ce loto est introuvable.";
        return;
    }

    currentEvent = eventData;
    
    // Affichage des infos
    const eventDate = new Date(currentEvent.date_event);
    displayEventTitle.textContent = currentEvent.title;
    displayEventDate.textContent = `📅 Le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
    displayCardPrice.textContent = currentEvent.card_price;

    checkEventStatus(); // Vérifie les dates (compte à rebours)

    // Récupérer les places déjà réservées pour ce loto
    const { data: bookingsData } = await supabase.from('bookings').select('id').eq('event_id', eventId);
    const bookingIds = bookingsData && bookingsData.length > 0 ? bookingsData.map(b => b.id) : [];
    
    if (bookingIds.length > 0) {
        const { data: bookedSeatsData } = await supabase.from('booking_seats').select('seat_id').in('booking_id', bookingIds);
        if (bookedSeatsData) {
            bookedSeatIds = bookedSeatsData.map(bs => bs.seat_id);
        }
    }

    // Récupérer le plan de la salle
    const { data: seatsData } = await supabase.from('seats').select('*').eq('venue_id', currentEvent.venue_id);
    availableSeats = seatsData || [];
    
    renderSeatGrid();
    updateTotal();
}

// 2. Afficher la grille (qui reproduira tes "lignes de tables" faites dans l'admin)
function renderSeatGrid() {
    if (availableSeats.length === 0) {
        clientSeatGrid.innerHTML = "<p>Aucune place définie pour cette salle.</p>";
        return;
    }

    const maxX = Math.max(...availableSeats.map(s => s.x_coord));
    const maxY = Math.max(...availableSeats.map(s => s.y_coord));
    
    clientSeatGrid.style.gridTemplateColumns = `repeat(${maxX + 1}, 35px)`;
    clientSeatGrid.innerHTML = '';

    for(let y = 0; y <= maxY; y++) {
        for(let x = 0; x <= maxX; x++) {
            const seat = availableSeats.find(s => s.x_coord === x && s.y_coord === y);
            const cell = document.createElement('div');
            
            if (seat) {
                cell.classList.add('seat-cell');
                // Si la place est déjà dans la liste des réservations
                if (bookedSeatIds.includes(seat.id)) {
                    cell.style.backgroundColor = '#555';
                    cell.style.borderColor = '#333';
                    cell.style.cursor = 'not-allowed';
                    cell.title = 'Déjà réservé';
                } else {
                    cell.title = `Rangée ${seat.row_name} - Place ${seat.seat_number}`;
                    cell.addEventListener('click', () => toggleSeatSelection(cell, seat));
                }
            } else {
                // Espace vide (allée entre les tables)
                cell.style.width = '35px';
                cell.style.height = '35px';
            }
            clientSeatGrid.appendChild(cell);
        }
    }
}

// 3. Sélectionner/Désélectionner une place
function toggleSeatSelection(cell, seat) {
    if (selectedSeats.includes(seat.id)) {
        selectedSeats = selectedSeats.filter(id => id !== seat.id);
        cell.classList.remove('active');
    } else {
        selectedSeats.push(seat.id);
        cell.classList.add('active');
    }
    updateTotal();
}

// 4. Calcul du Total
function updateTotal() {
    const cartonPrice = currentEvent ? currentEvent.card_price : 0;
    const cartons = parseInt(cartonCountInput.value) || 0;
    
    let snackPrice = 0;
    if (snackSelect.value === 'croque') snackPrice = 5;
    if (snackSelect.value === 'crepe') snackPrice = 4;

    const total = (cartons * cartonPrice) + snackPrice;
    totalPriceDisplay.textContent = total.toFixed(2);
}

cartonCountInput.addEventListener('input', updateTotal);
snackSelect.addEventListener('change', updateTotal);

// 5. Enregistrer la réservation (Insertions Supabase)
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) {
        alert('Choisis au moins un jeton de place sur le plan !');
        return;
    }

    const name = document.getElementById('clientName').value;
    const email = document.getElementById('clientEmail').value;
    const total = parseFloat(totalPriceDisplay.textContent);
    
    // Génère un code secret complexe si un snack est commandé
    const secretCode = snackSelect.value ? 'SNK-' + Math.random().toString(36).substring(2, 8).toUpperCase() : null;

    try {
        const btn = bookingForm.querySelector('button');
        btn.textContent = 'Validation...';
        btn.disabled = true;

        // 5a. Créer la réservation principale et récupérer son ID (.select())
        const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert([{
                event_id: currentEvent.id,
                customer_name: name,
                customer_email: email,
                total_cards: parseInt(cartonCountInput.value),
                total_price: total,
                snack_secret_code: secretCode
            }])
            .select()
            .single();

        if (bookingError) throw bookingError;

        // 5b. Lier les places sélectionnées à cette réservation
        const bookingSeatsToInsert = selectedSeats.map(seatId => ({
            booking_id: bookingData.id,
            seat_id: seatId
        }));

        const { error: seatsError } = await supabase.from('booking_seats').insert(bookingSeatsToInsert);
        if (seatsError) throw seatsError;

        // 5c. Message de succès et rechargement
        let successMsg = '🎉 Réservation confirmée !';
        if (secretCode) {
            successMsg += `\n\n🍔 Ton code secret pour le snack est : ${secretCode}\nConserve-le précieusement !`;
        }
        alert(successMsg);
        window.location.reload(); // Recharge la page, les places seront maintenant grisées

    } catch (error) {
        console.error(error);
        alert('Une erreur est survenue lors de la réservation.');
        bookingForm.querySelector('button').disabled = false;
        bookingForm.querySelector('button').textContent = 'Valider mes cartons';
    }
});

// Le compte à rebours reste le même
function checkEventStatus() {
    const now = new Date().getTime();
    const openDate = new Date(currentEvent.sales_open_date).getTime();
    const closeDate = new Date(currentEvent.sales_close_date).getTime();

    if (now > closeDate) {
        countdownArea.style.display = 'none';
        reservationArea.style.display = 'block';
        reservationArea.classList.add('locked');
        return;
    }

    if (now < openDate) {
        countdownArea.style.display = 'block';
        reservationArea.style.display = 'none';
        
        timerInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            const distance = openDate - currentTime;

            if (distance < 0) {
                clearInterval(timerInterval);
                checkEventStatus();
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownTimer.textContent = `${days}j ${hours}h ${minutes}m ${seconds}s`;
        }, 1000);
        return;
    }

    countdownArea.style.display = 'none';
    reservationArea.style.display = 'block';
    reservationArea.classList.remove('locked');
}

loadEvent();
