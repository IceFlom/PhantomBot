$.lang.register('ttscommand.usage', 'Mit dem Befehl !tts kannst du deine Nachricht von Hans vorlesen lassen.');
$.lang.register('ttscommand.toolong', 'Deine Nachricht ist zu lang! Max: $1 Zeichen, deine Nachricht: $2 Zeichen.');
$.lang.register('ttscommand.offlinewarning', 'Der Stream ist offline. TTS kann nicht funktionieren.');
$.lang.register('ttscommand.notenoughpoints', 'Du hast nur $1. Gebühr: $2, Preis pro Zeichen: $3 = Gesamtkosten: $4');
$.lang.register('ttscommand.notenoughtime', 'du bist erst seit $2 hier, $1 sind notwendig.');
$.lang.register('ttscommand.success', 'Nachricht wird abgespielt. ($1 Zeichen)');
$.lang.register('ttscommand.write', 'schreibt');

// admin
$.lang.register('ttscommand.nowsurl', 'Es ist kein TTS-Webservice gespeichert. Hinterlege eine URL mit !tts wsurl [URL zu einem Webservice]');
$.lang.register('ttscommand.wsurl.updated', 'TTS-Webservice-URL aktualisiert. Neuer Wert: $1');
$.lang.register('ttscommand.wsurl.usage', 'Aktuell: $1. Um die TTS-Webservice-URL zu ändern, schreibe !tts wsurl [URL zu einem Webservice]');
$.lang.register('ttscommand.fixedcost.updated', 'Feste Gebühr aktualisiert. Neuer Wert: $1');
$.lang.register('ttscommand.fixedcost.usage', 'Aktuell: $1. Um die feste Gebühr zu ändern, schreibe !tts fixedcost [Zahl]');
$.lang.register('ttscommand.multipliercost.updated', 'Variabler Preis pro Zeichen aktualisiert. Neuer Wert: $1');
$.lang.register('ttscommand.multipliercost.usage', 'Aktuell: $1. Um den variablen Preis pro Zeichen zu ändern, schreibe !tts multipliercost [Zahl]');
$.lang.register('ttscommand.maxlength.updated', 'Maximale Nachrichtenlänge aktualisiert. Neuer Wert: $1');
$.lang.register('ttscommand.maxlength.usage', 'Aktuell: $1. Um die maximale Nachrichtenlänge zu ändern, schreibe !tts maxlength [Zahl]');