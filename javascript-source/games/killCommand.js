/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * killCommand.js
 *
 * Viewers can show each other the love of REAL friends by expressing it in pain.
 */
(function() {
    const killType = {
        SELF: 'self',
        ATTACKER: 'attacker',
        INJURED: 'injured',
        VICTIM: 'victim'
    }
    var selfMessageCount = 0,
        attackerMessageCount = 0,
        injuredMessageCount = 0,
        victimMessageCount = 0,
        lastSelfRand = -1,
        lastAttackerRand = -1,
        lastInjuredRand = -1,
        lastVictimRand = -1,
        killTimeout = $.getSetIniDbNumber('killSettings', 'killTimeoutTime', 60),
        jailTimeout = $.getSetIniDbNumber('killSettings', 'jailTimeoutTime', 120),
        minCostInjured = $.getSetIniDbNumber('killSettings', 'minCostInjured', 1),
        maxCostInjured = $.getSetIniDbNumber('killSettings', 'maxCostInjured', 49),
        minCostKill = $.getSetIniDbNumber('killSettings', 'minCostKill', 50),
        maxCostKill = $.getSetIniDbNumber('killSettings', 'maxCostKill', 100),
        rand,
        currentlyDeadList = [];

    /**
     * @function reloadKill
     */
    function reloadKill() {
        killTimeout = $.getIniDbNumber('killSettings', 'killTimeoutTime');
        jailTimeout = $.getIniDbNumber('killSettings', 'jailTimeoutTime');
        minCostInjured = $.getIniDbNumber('killSettings', 'minCostInjured');
        maxCostInjured = $.getIniDbNumber('killSettings', 'maxCostInjured');
        minCostKill = $.getIniDbNumber('killSettings', 'minCostKill');
        maxCostKill = $.getIniDbNumber('killSettings', 'maxCostKill');
    }

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('killcommand.self.' + i); i++) {
            selfMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.attacker.' + i); i++) {
            attackerMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.injured.' + i); i++) {
            injuredMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.victim.' + i); i++) {
            victimMessageCount++;
        }
        $.consoleDebug($.lang.get('killcommand.console.loaded', selfMessageCount, attackerMessageCount, injuredMessageCount, victimMessageCount));
    }

    /**
     * getKillResult
     * @return {killType}
     */
    function getKillResult() {
        var randomNumber = $.randRange(1, 100);
        if (randomNumber > 0 && randomNumber <= 40) {
            return killType.ATTACKER;
        } else if (randomNumber > 40 && randomNumber <= 60) {
            return killType.INJURED;
        } else {
            return killType.VICTIM;
        }
    }

    function selfKill(sender) {
        do {
            rand = $.randRange(1, selfMessageCount);
        } while (rand === lastSelfRand);
        $.say($.lang.get('killcommand.self.' + rand, $.resolveRank(sender)));
        if (!$.isMod(sender) && killTimeout > 0) {
            doTimeout(sender, killTimeout);
        }
        lastSelfRand = rand;
    }

    function checkTimeout(sender, opfer) {
        return !$.isMod(sender) && !$.isMod(opfer) && killTimeout > 0;
    }

    function doTimeout(user, timeout) {
        setTimeout(function() {
            Packages.tv.phantombot.PhantomBot.instance().getSession().say('.timeout ' + user + ' ' + timeout);
        }, 2000);
    }

    function doStrafzahlung(user, strafe) {
        var userPoints = $.getUserPoints(user),
            lang;
        // Angreifer nicht genug Geld für die Strafzahlung
        if (userPoints < strafe) {
            $.setIniDbNumber('points', user.toLowerCase(), 0);
            if (!$.isMod(user)) {
                doTimeout(user, jailTimeout);
                lang = $.lang.get('killcommand.nopoints.jail', $.resolveRank(user), $.getPointsString(strafe), jailTimeout);
            } else {
                lang = $.lang.get('killcommand.nopoints.jailmod', $.resolveRank(user), $.getPointsString(strafe));
            }
        } else {
            $.inidb.decr('points', user.toLowerCase(), strafe);
            lang = $.lang.get('killcommand.strafe', $.resolveRank(user), $.getPointsString(strafe));
        }
        setTimeout(function() {
            $.say(lang);
        }, 1000);
    }

    // Angreifer stirbt
    function processAttacker(sender, opfer) {
        var tries = 0;
        do {
            tries++;
            rand = $.randRange(1, attackerMessageCount);
        } while (rand == lastAttackerRand && tries < 5);
        $.say($.lang.get('killcommand.attacker.' + rand, $.resolveRank(sender), $.resolveRank(opfer)));
        // Keine Zahlung
        if (checkTimeout(sender, opfer)) {
            doTimeout(sender, killTimeout);
        }
        lastAttackerRand = rand;
    }

    // Opfer wird nur verletzt
    function processInjured(sender, opfer) {
        var tries = 0,
            strafe = $.randRange(minCostInjured, maxCostInjured);
        do {
            tries++;
            rand = $.randRange(1, injuredMessageCount);
        } while (rand == lastInjuredRand && tries < 5);
        $.say($.lang.get('killcommand.injured.' + rand, $.resolveRank(sender), $.resolveRank(opfer)));
        doStrafzahlung(sender, strafe);
        // Sender zahlt 1-50
        lastInjuredRand = rand;
    }

    // Opfer stirbt
    function processVictim(sender, opfer) {
        var tries = 0,
            strafe = $.randRange(minCostKill, maxCostKill);
        do {
            tries++;
            rand = $.randRange(1, victimMessageCount);
        } while (rand == lastVictimRand && tries < 5);
        $.say($.lang.get('killcommand.victim.' + rand, $.resolveRank(sender), $.resolveRank(opfer)));
        doStrafzahlung(sender, strafe);
        if (checkTimeout(sender, opfer)) {
            doTimeout(opfer, killTimeout);
        }
        lastVictimRand = rand;
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();

        // AAS Blockade
        if ($.isOnAbuseList(sender)) {
            $.sendBlockedMessage(sender);
            return;
        }
        /**
         * @commandpath kill [username] - Kill a fellow viewer (not for real!), omit the username to kill yourself
         */
        if (command.equalsIgnoreCase('kill')) {
            var opfer = args[0];
            if (opfer != null) {
                opfer = opfer.toLowerCase().replace("@", "");
                // Angegebener Benutzer existiert nicht
                if (!$.userExists(opfer)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.nouser', $.username.resolve(opfer)));
                    return;
                }
            }
            if (args.length <= 0 || opfer.equalsIgnoreCase(sender)) {
                selfKill(sender);
            } else if ($.getUserPoints(sender) < 10) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.nopoints'));
            } else {
                var typeOfKill = getKillResult();
                switch (typeOfKill) {
                    case killType.ATTACKER:
                        processAttacker(sender, opfer);
                        break;
                    case killType.INJURED:
                        processInjured(sender, opfer);
                        break;
                    case killType.VICTIM:
                        processVictim(sender, opfer);
                        break;
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if (selfMessageCount == 0 && attackerMessageCount == 0 && injuredMessageCount == 0 && victimMessageCount == 0) {
            loadResponses();
        }
        $.registerChatCommand('./games/killCommand.js', 'kill', 7);
    });

    $.reloadKill = reloadKill;
})();
