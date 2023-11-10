const moment = require('moment');

const YNABClient = require('./ynab/client');

const synologyReporter = require('./reporters/synology');
const telegramReporter = require('./reporters/telegram');
const emailReporter = require('./reporters/email');
const webhookReporter = require('./reporters/webhook');
const stdoutReporter = require('./reporters/stdout');

class Engine {

    async _getDataForConfig(conf) {
        const client = new YNABClient(conf.ynab.accessToken);

        const budgetNameOrId = conf.ynab.defaultBudgetNameOrId;

        const budget = await client.getBudgetMatching(
            b => b.name === budgetNameOrId || b.id === budgetNameOrId
        );
        if (!budget) {
            throw new Error('no budget found for identifier "' + budgetNameOrId + '"');
        }

        const categoriesData = await client.getCategoriesForBudgetId(budget.id);
        const accountsData = await client.getAccountsForBudgetId(budget.id);

        const formatter = new Intl.NumberFormat(
            conf.output.locale,
            client.getNumberFormatSpecificationsForBudget(budget),
        );

        const relevantCategories = categoriesData.
            map(macro => ({
                ...macro,
                _matchingSettingsKey: Object.keys(conf.ynab.categories).find(
                    specified => macro.id === specified || macro.name === specified || specified === '*'
                ),
            })).
            filter(macro => !!macro._matchingSettingsKey).
            map(macro => ({
                ...macro,
                categories: macro.categories.filter(category => !!conf.ynab.categories[macro._matchingSettingsKey].find(
                    specified => category.id === specified || category.name === specified || specified === '*'
                ))
            }));

        const reportAccounts = !!conf.ynab.accounts.length;

        let totals = {};
        let accounts = {};
        let networth = 0;
        if (reportAccounts) {
            for (let account of accountsData) {
                for (let acct of conf.ynab.accounts) {
                    if (account.name == acct) {
                        account.balance = account.balance / 1000
                        const balance = account.balance
                        networth = networth + balance;
    
                        const acct_type = account.type
    
                        totals[acct_type] = (totals[acct_type] || 0) + balance
    
                        if (!accounts[acct_type]) {
                            accounts[acct_type] = [];
                        }
                        accounts[acct_type].push(account)
                    }
                }
            }
        }

        const data = [];
        
        data.push({ header: 'Your YNAB digest for ' + moment().format('ddd, MMM D') });
        data.push({ separator: 1 });

        if (reportAccounts) {
            data.push({ text: 'NET WORTH: ' + formatter.format(networth) });
            data.push({ separator: 1 });

            for (var key in totals) {
                data.push({ text: key + ': ' + formatter.format(totals[key]) });
                accounts[key].forEach(function (acct) {
                    data.push({ text: '  ' + acct.name + ': ' + formatter.format(acct.balance) });
                })
                data.push({ separator: 1 });
            }
        }

        data.push({ header: 'AVAILABLE' });

        for (const macroCategory of relevantCategories) {
            for (const category of macroCategory.categories) {
                data.push({ text: category.name + ': ' + formatter.format(category.balance / 1000) });
            }
        }

        data.push({ separator: 1 });

        data.push({ header: 'SPENDING' });

        for (const macroCategory of relevantCategories) {
            for (const category of macroCategory.categories) {
                if (category.activity < 0) {
                    data.push({ text: category.name + ': ' + formatter.format(category.activity / 1000 * -1) });
                }
            }
        }

        data.push({ separator: 1 });

        return data;
    }

    async _report(conf, data) {

        const attemptDelivery = async (name, handler) => {
            try {
                await handler(conf, data);
            } catch (err) {
                throw new Error('error reporting via "' + name + '" handler', { cause: err })
            }
        }

        let reportResults;

        try {
            reportResults = await Promise.allSettled([
                attemptDelivery('stdout', stdoutReporter),
                attemptDelivery('synology', synologyReporter),
                attemptDelivery('email', emailReporter),
                attemptDelivery('telegram', telegramReporter),
                attemptDelivery('webhook', webhookReporter),
            ]);
        } catch (err) {
            throw new Error('error running reporters', { cause: err })
        }

        const failed = reportResults.filter(r => r.status !== 'fulfilled');

        if (!failed.length) {
            return reportResults.
                filter(r => r.status === 'fulfilled').
                map(r => r.value);
        }

        throw new AggregateError(
            failed.map(r => r.reason),
            'reporting failed for ' + failed.length + ' handlers',
        );
    }

    async run(conf, budgetName) {
        const data = await this._getDataForConfig(conf, budgetName);

        return this._report(conf, data);
    }

}

module.exports = Engine;