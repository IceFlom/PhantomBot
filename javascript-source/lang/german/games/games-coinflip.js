 /**
 * games-coinflip.js
 *
 * by IceFlom
 */

// Error Messages
$.lang.register('coinflip.onlineonly', 'dieser Befehl funktioniert nur, wenn ein Stream läuft.');
$.lang.register('coinflip.self', 'du kannst dich nicht selbst herausfordern!');
$.lang.register('coinflip.usage', 'Nutzung des Befehls: !coinflip [Nutzername] [Anzahl Punkte] - Einsatzlimit: $1');
$.lang.register('coinflip.targetunknown', '$1 ist nicht hier.');
$.lang.register('coinflip.alreadyingame', '$1 ist bereits in einem aktiven Spiel.');
$.lang.register('coinflip.noresponse', '$1 hat nicht reagiert, Herausforderung von $2 abgebrochen.');
$.lang.register('coinflip.nochallenge', 'es liegt keine Herausforderung gegen dich vor.');

// Not enough points
$.lang.register('coinflip.notenoughpoints', '$1 hat nicht genug Ice-Coins. Gefordert: $2, Vorhanden: $3');
$.lang.register('coinflip.notenoughnow', '$1 hat mittlerweile nicht mehr genug Ice-Coins.');

// Game messages
$.lang.register('coinflip.start', '$1 möchte mit $2 um $3 spielen. $2 kann annehmen (!accept) oder ablehnen (!decline)');
$.lang.register('coinflip.summary', 'Münze geworfen... $1 gewinnt gegen $2. $3 wurden transferiert.');
$.lang.register('coinflip.summarywithtax', 'Münze geworfen... $1 gewinnt gegen $2. Sieger erhält $3, der Staat behält eine Steuer in Höhe von $4% ein.');
$.lang.register('coinflip.accepted', '$1 hat deine Herausforderung angenommen.');
$.lang.register('coinflip.declined', '$1 hat deine Herausforderung abgelehnt.');