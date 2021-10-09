# Hi Befehl

## Beschreibung
Der !hi Befehl ermöglicht eine benutzerspezifische Begrüßung, welche mit eben diesem Befehl ausgelöst werden kann.
Nutzer können sich selbst eigene Begrüßungstexte hinterlegen, ein Admin kann auch Texte mit Audiofunktion und ähnliches
hinzufügen. Es lässt sich optional eine Standardbegrüßung hinterlegen, die immer dann ausgegeben wird, wenn ein Nutzer
keinen eigneen Text hinterlegt hat.

## Manuelle Installation
!!! info
    Wird das Docker-Image "iceflom/phantombot-iceversion" genutzt, ist keine weitergehende Installation erforderlich.

Es werden drei Dateien benötigt, die manuell in die passenden Verzeichnisse des Bots abgelegt werden müssen.
Die Skriptnamen sind Direktverlinkungen in das Git Repository. Dort gibt es oben rechts die Option, die Datei runterzuladen.

Die Ablagepfade sind relativ zum Phantombot-Hauptverzeichnis angegeben.

Auch wenn die englische Chatausgabe nicht verwendet wird, sollte sie installiert werden, da englisch die "Fallback"-Sprache des Bots ist, wenn mal eine Übersetzung fehlt.

| Skript                       | Ablagepfad | Beschreibung      |
| ---------------------------- | ------------ | ----------------|
| [hicommand.js](https://git.iceflom.de/iceflom/phantombot-iceversion/-/raw/master/javascript-source/ice/hiCommand.js){target=_blank}                                    | scripts/custom/hicommand.js                     | Hauptskript. |
| [german/custom-hicommand.js](https://git.iceflom.de/iceflom/phantombot-iceversion/-/raw/master/javascript-source/lang/german/ice/custom-hiCommand.js){target=_blank}   | scripts/lang/german/custom/custom-hicommand.js  | Deutsche Sprachausgabe. |
| [english/custom-hicommand.js](https://git.iceflom.de/iceflom/phantombot-iceversion/-/raw/master/javascript-source/lang/english/ice/custom-hiCommand.js){target=_blank} | scripts/lang/english/custom/custom-hicommand.js | Englische Sprachausgabe. |

Vorgehen:

1. Alle drei Skripts downloaden.
2. Skripts in die angegebenen Pfade verschieben.
3. Bot neustarten.

Das Skript wird automatisch geladen und aktiviert und ist einsatzbereit. Mit `!hi help` kann am einfachsten getestet werden,
ob das Skript läuft.

## Befehle

| Befehl                       | Berechtigung | Beschreibung            |
| ---------------------------- | ------------ | ----------------------- |
| `!hi`                        | Benutzer     | Ausgabe der Begrüßung, wenn vorhanden, sonst die Standardnachricht, wenn vorhanden, sonst nichts. |
| `!hi help`                   | Benutzer     | Ausgabe eines Hilfetextes. |
| `!hi set [text]`             | Benutzer     | Speichert den angegebenen Text für den Nutzer. |
| `!hi test [name]`            | Admin        | Begrüßung des angegebenen Nutzers zu Testzwecken auslösen. |
| `!hi onlineonly`             | Admin        | Umschalten, ob !hi nur dann etwas ausgeben soll, wenn der Kanal live ist. Standard: deaktiviert |
| `!hi cost [zahl]`            | Admin        | Höhe der Kosten an Punkten, um einen eigenen Text zu speichern. Standard: 0 |
| `!hi default [text]`         | Admin        | Standardbegrüßung speichern. Standard: keine |
| `!hi adminset [name] [text]` | Admin        | Speichert den angegebenen Text für den angegebenen Nutzer. |

## Variablen
!!! info
    Auch nachfolgenden Abschnitt "Filterung" beachten!

Folgende Variablen können in den Texten genutzt werden, sie werden entsprechend ausgewertet.

* `(username)` Wird mit dem Namen des Nutzers ersetzt, der den !hi-Befehl auslöst.
* `(playsound soundname)` Spielt den angegebenen Sound ab.
* `(alert filename)` Löst den angegebenen Alert (Videodatei) aus, siehe dazu auch [Phantombot Doku - alert](https://phantombot.github.io/PhantomBot/guides/#guide=content/commands/command-variables&jumpto=alert){target=_blank}

## Filterung

Texte, die von Nutzern gesetzt werden, durchlaufen eine Filterung. Dies passiert aus Sicherheits- und Antispamgründen.
Die Filterung wird bei Adminaktionen nicht angewendet, Standardtexte oder Texte für andere Nutzer können also uneingeschränkt gesetzt werden.

Filterung enthält:

* `\n` wird aus den Texten entfernt.
* Nach `!` wird immer ein Leerzeichen ergänzt, damit keine Bot-Befehle ausgelöst werden können.
* Nach `/`  wird immer ein Leerzeichen ergänzt, damit keine Twitch-Befehle ausgelöst werden können.
* `playsound` wird entfernt, Sounds können nur von Admins gesetzt werden.
* `alert` wird entfernt, Alerts können nur von Admins gesetzt werden.

## Mehrzeilige Begrüßungen

Um mehrzeilige Begrüßungen nutzen zu können, kann `\n` innerhalb des Textes genutzt werden.
Die Nachricht wird dann zeilenweise mit einem Delay von 1 Sekunde ausgegeben. Dies kann nur von einem
Admin genutzt werden.

## Befehl !hi anpassen

Wenn statt !hi ein anderer Hauptbefehl gewünscht ist, muss ein entsprechender Alias angelegt werden.

## Cooldown

Zur Vermeidung von Spam durch den !hi-Befehl sollte der Cooldown angepasst werden. Dies geht im Adminpanel, 
der Befehl wird bei den integrierten Default-Commands angezeigt.