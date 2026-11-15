import { supabase } from './supabase.js';

const displayEventTitle = document.getElementById('displayEventTitle');
const displayEventDate = document.getElementById('displayEventDate');
const countdownArea = document.getElementById('countdownArea');
const countdownTimer = document.getElementById('countdownTimer');
const reservationArea = document.getElementById('reservationArea');
const displayCardPrice = document.getElementById('displayCardPrice');

let currentEvent = null;
let timerInterval = null;

async function loadLatestEvent() {
    // On récupère le loto le plus récent qui est publié
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('date_event', { ascending: true })
        .limit(1)
        .single();

    if (error || !data) {
        displayEventTitle.textContent = "Aucun Loto prévu pour le moment !";
        return;
    }

    currentEvent = data;
    
    // Formatage de la date en français
    const eventDate = new Date(currentEvent.date_event);
    displayEventTitle.textContent = currentEvent.title;
    displayEventDate.textContent = `📅 Le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
    displayCardPrice.textContent = currentEvent.card_price;

    checkEventStatus();
}

function checkEventStatus() {
    const now = new Date().getTime();
    const openDate = new Date(currentEvent.sales_open_date).getTime();
    const closeDate = new Date(currentEvent.sales_close_date).getTime();

    // 1. La vente est terminée
    if (now > closeDate) {
        countdownArea.style.display = 'none';
        reservationArea.style.display = 'block';
        reservationArea.classList.add('locked'); // Ajoute le cadenas grisé
        return;
    }

    // 2. La vente n'est pas encore ouverte (Compte à rebours)
    if (now < openDate) {
        countdownArea.style.display = 'block';
        reservationArea.style.display = 'none';
        
        timerInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            const distance = openDate - currentTime;

            if (distance < 0) {
                clearInterval(timerInterval);
                checkEventStatus(); // On relance la vérification pour ouvrir la vente
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

    // 3. La vente est ouverte
    countdownArea.style.display = 'none';
    reservationArea.style.display = 'block';
    reservationArea.classList.remove('locked');
    
    // Prochaine étape : Charger le plan de salle ici !
    console.log("Vente ouverte, prêt à charger les places !");
}

// Lancement au chargement de la page
loadLatestEvent();
