// Liste de tous les <select> pour les commandes
let selects = document.querySelectorAll('.commande select');

/**
 * Modifie l'état d'une commande sur le serveur.
 * @param {InputEvent} event Objet d'information sur l'événement.
 */
const modifyEtatCommande = async (event) => {
    let data = {
        idCommande: parseInt(event.target.parentNode.parentNode.dataset.idCommande),
        idEtatCommande: parseInt(event.target.value)
    };

    await fetch('/commande', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// Ajoute l'exécution de la fonction "modifyEtatCommande" pour chaque <select> 
// lorsque son état change.
for (let select of selects) {
    select.addEventListener('change', modifyEtatCommande)
}



// WS Call here!!
    
let socket = new WebSocket('ws://localhost:5000');
// Connection opened
for(let i=0; i<selects.length; i++){
    selects[i].addEventListener('change',function(event){
         socket = new WebSocket('ws://localhost:5000');
        let data = {
             type: 'status',
            idCommande: parseInt(event.target.parentNode.parentNode.dataset.idCommande),
            textValue: event.target.options[event.target.selectedIndex].text
        };
        // send Data
        socket.addEventListener('open', function (e) {
            socket.send(JSON.stringify(data));
        });
    })
}


 // Listen for messages
 socket.addEventListener('message', function (e) {
    const UpData = JSON.parse(e.data);
    for (let select of selects) {
       let id =  parseInt(select.parentNode.parentNode.dataset.idCommande)
       if(id == UpData.idCommande){
         select.options[select.selectedIndex].text = UpData.textValue
        break;
       }
        
    }
});




