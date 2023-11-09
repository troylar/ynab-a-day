const config = require('config');

function getConfigFromFile() {
    const getIfPresent = (key, defaultValue = null) => {
        if (config.has(key)) {
            return config.get(key);
        }
        return defaultValue;
    }

    return {
        ynab: {
            accessToken: config.get('ynab.key'),
            defaultBudgetNameOrId: config.get('ynab.budget'),
            categories: config.get('ynab.categories'),
            accounts: config.get('ynab.accounts'),
        },
        output: {
            locale: getIfPresent('output.locale', 'en-US'),
            synology: {
                enabled: getIfPresent('output.synology.enabled'),
                webhook: getIfPresent('output.synology.webhook') || getIfPresent('synology_chat.webhook'), // compatibility with current config syntax
            },
            telegram: {
                enabled: getIfPresent('output.telegram.enabled'),
                bot_token: getIfPresent('output.telegram.bot_token'),
                destination_id: getIfPresent('output.telegram.destination_id'),
            },
            stdout: {
                enabled: getIfPresent('output.stdout.enabled'),
                format: getIfPresent('output.stdout.format', 'text'),
            },
        }
    };
}

module.exports = getConfigFromFile;