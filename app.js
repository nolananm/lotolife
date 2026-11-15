import { supabase } from './supabase.js';

const displayEventTitle = document.getElementById('displayEventTitle');
const displayEventDate = document.getElementById('displayEventDate');
const countdownArea = document.getElementById('countdownArea');
const countdownTimer = document.getElementById('countdownTimer');
const reservationArea = document.getElementById('reservationArea');
const displayCardPrice = document.getElementById('displayCardPrice');

let currentEvent = null;
let timerInterval = null;

async function loadEvent() {
    // 1. Récupère l'ID du loto dans l'URL (ex: loto.html?id=xxx-yyy)
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        displayEventTitle.textContent = "Aucun loto sélectionné ! Retourne à l'accueil.";
        return;
    }

    // 2. Charge uniquement le loto demandé
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error || !data) {
        displayEventTitle.textContent = "Ce loto est introuvable.";
        return;
    }

    currentEvent = data;
    
    // Formatage de la date
    const eventDate = new Date(currentEvent.date_event);
    displayEventTitle.textContent = currentEvent.title;
    displayEventDate.textContent = `📅 Le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
    displayCardPrice.textContent = currentEvent.card_price;

    checkEventStatus();
}

// ... garde ta fonction checkEventStatus() ici ...

// Lancement au chargement de la page
loadEvent();
