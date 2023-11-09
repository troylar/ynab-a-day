const rq = require('request-promise');

const formatter = require('./formatters/telegram');

async function report(rootConfig, data) {
    const conf = rootConfig.output.telegram;
    if (!conf.enabled) {
        return null;
    }

    const requireParam = n => {
        const v = conf[n];
        if (!v) {
            throw new Error('required parameter "' + n + '" is missing in telegram output configuration');
        }
        return v;
    }

    const botToken = requireParam('bot_token');
    const destinationId = requireParam('destination_id');

    let text = formatter(data);

    const response = await rq({
        method: 'POST',
        uri: 'https://api.telegram.org/bot' + botToken + '/sendMessage',
        json: {
            'chat_id': destinationId,
            'text': text,
            'disable_notification': true,
            'parse_mode': 'HTML',
        },
    });
    
    return response;
}

module.exports = report;
