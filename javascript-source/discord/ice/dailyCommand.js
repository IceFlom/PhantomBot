/*
 * by IceFlom
 */

(function() {
    var payout = $.getSetIniDbNumber('discordDailyCommandSettings', 'payout', 100),
        intervalHours = $.getSetIniDbNumber('discordDailyCommandSettings', 'intervalhours', 24);

    function reloadDailyCommand() {
        payout = $.getIniDbNumber('discordDailyCommandSettings', 'payout');
        intervalHours = $.getIniDbNumber('discordDailyCommandSettings', 'intervalhours');
    }

    /**
     * @event command
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention();

        if (command.equalsIgnoreCase('daily')) {
            var twitchName = $.discord.resolveTwitchName(event.getSenderId());
            if (twitchName !== null) {
                twitchName = twitchName.toLowerCase();
                var userTimestamp = $.getSetIniDbNumber('discordDailyCommandUsers', twitchName, 0),
                    currentTime = new Date().getTime(),
                    timeGone = currentTime - userTimestamp,
                    hoursSinceLast = Math.trunc(timeGone / 1000 / 60 / 60);
                if (hoursSinceLast >= 24) {
                    $.setIniDbNumber('discordDailyCommandUsers', twitchName, currentTime);
                    $.inidb.incr('points', twitchName, payout);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.success', $.getPointsString(payout)));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.wait', $.getFormattedTime(timeGone), intervalHours));
                }
            } else {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/commands/dailyCommand.js', 'daily', 0);
    });
    $.reloadDailyCommand = reloadDailyCommand;
})();
