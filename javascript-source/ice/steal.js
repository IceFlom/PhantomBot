/**
 * stealSystem.js
 * by IceFlom
 *
 */
(function() {
	var minSteal = $.getSetIniDbNumber('stealSettings', 'minSteal', 1),
        maxSteal = $.getSetIniDbNumber('stealSettings', 'maxSteal', 50),
        onlineOnly = $.getSetIniDbBoolean('stealSettings', 'onlineonly', true);

	/**
     * @function reloadSteal
     */
	function reloadSteal() {
		minSteal = $.getIniDbNumber('stealSettings', 'minSteal');
        maxSteal = $.getIniDbNumber('stealSettings', 'maxSteal');
        onlineOnly = $.getIniDbBoolean('stealSettings', 'onlineonly');
    }

    /**
     * @function toggleOnlineonly
     * @param {string} sender
     */
    function toggleOnlineonly(sender) {
        onlineOnly = !onlineOnly;
        $.setIniDbBoolean('stealSettings', 'onlineonly', onlineOnly);
        if (onlineOnly) {
            $.say($.whisperPrefix(sender) + $.lang.get('steal.onlineonly.enabled'));
        } else {
            $.say($.whisperPrefix(sender) + $.lang.get('steal.onlineonly.disabled'));
        }
    }

	/**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionInt = parseInt(args[1]);

        if (action != null) {
            action = action.replace("@", "");
        }

		if (command.equalsIgnoreCase('steal')) {
            if (onlineOnly && !$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('steal.onlineonly'));
                return;
            }
			if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('steal.usage'));
                return;
            }

            // set min value
            if (action.equalsIgnoreCase('min')) {
                if (!actionInt) {
                    $.say($.whisperPrefix(sender) + $.lang.get('steal.min.usage'));
                } else {
                    $.setIniDbNumber('stealSettings', 'minSteal', actionInt);
                    reloadSteal();
                    $.say($.whisperPrefix(sender) + $.lang.get('steal.min.success', actionInt));
                }
                return;
            }
            // set max value
            if (action.equalsIgnoreCase('max')) {
                if (!actionInt) {
                    $.say($.whisperPrefix(sender) + $.lang.get('steal.max.usage'));
                } else {
                    $.setIniDbNumber('stealSettings', 'maxSteal', actionInt);
                    reloadSteal();
                    $.say($.whisperPrefix(sender) + $.lang.get('steal.max.success', actionInt));
                }
                return;
            }
            // toggle onlineonly
            if (args[0].equalsIgnoreCase('onlineonly')) {
                toggleOnlineonly(sender);
                return;
            }
            // Validation: Thief = victim?
            if (sender.equalsIgnoreCase(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('steal.self', $.username.resolve(action)));
                return;
            }
            // Validation: User in database?
            if (!$.userExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('steal.nouser.usage', $.username.resolve(action)));
                return;
            }

            var angreiferPoints = $.getUserPoints(sender),
                opferPoints = $.getUserPoints(action);
            // Angreifer hat 0 Punkte
            if (angreiferPoints == 0) {
                $.say($.lang.get('steal.user.nopoints', $.username.resolve(sender)));
                return;
            }
            // Opfer hat 0 Punkte
            if (opferPoints == 0) {
                $.say($.lang.get('steal.user.nopoints', $.username.resolve(action)));
                return;
            }

            // Adjust max points if user has less points
            var maxPoints = maxSteal;
            if (angreiferPoints < maxPoints) {
                maxPoints = angreiferPoints;
            }
            if (opferPoints < maxPoints) {
                maxPoints = opferPoints;
            }
            var randInt = $.randRange(minSteal, maxPoints);

            // Start
            $.say($.whisperPrefix(sender) + $.lang.get('steal.tryme', $.getPointsString(randInt), $.username.resolve(action)));
            var whoSteals = $.randRange(1, 100);
            if (whoSteals > 50) {
                // Thief looses
                var police = $.randRange(1, 100);
                if (police > 30) {
                    // points to tresor
                    $.inidb.decr('points', sender.toLowerCase(), randInt);
                    $.inidb.incr('polizei', 'tresor', randInt);
                    setTimeout(function() {
                        $.say($.lang.get('steal.target.police', $.getPointsString(randInt), $.username.resolve(sender)));
                    }, 5e3);
                } else {
                    // victim gets the points
                    $.inidb.decr('points', sender.toLowerCase(), randInt);
                    $.inidb.incr('points', action.toLowerCase(), randInt);
                    setTimeout(function() {
                        $.say($.lang.get('steal.target.steals', $.getPointsString(randInt), $.username.resolve(action), $.username.resolve(sender)));
                    }, 5e3);
                }
            } else {
                // Thief wins
                $.inidb.decr('points', action.toLowerCase(), randInt);
                $.inidb.incr('points', sender.toLowerCase(), randInt);
                setTimeout(function() {
                    $.say($.whisperPrefix(sender) + $.lang.get('steal.sender.steals', $.getPointsString(randInt), $.username.resolve(action)));
                }, 5e3);
            }

		}
	});

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./ice/steal.js')) {
            $.registerChatCommand('./ice/steal.js', 'steal', 7);
            $.registerChatSubcommand('steal', 'min', 1);
            $.registerChatSubcommand('steal', 'max', 1);
        }
    });
    $.reloadSteal = reloadSteal;
})();
