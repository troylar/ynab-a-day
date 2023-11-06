const config = require('config');
const ynab = require("ynab");
const rq = require('request-promise');
const moment = require('moment');
const axios = require('axios')

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

const cache = {
  budgets: null,
  categories: {},
  accounts: {},
};

function getConfig() {
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
        webhook: getIfPresent('output.synology_chat.webhook') || getIfPresent('synology_chat.webhook'), // compatibility with current config syntax
      },
      telegram: {
        bot_token: getIfPresent('output.telegram.bot_token'),
        destination_id: getIfPresent('output.telegram.destination_id'),
      }
    }
  };
}

const parsedConfig = getConfig();

const ynabAPI = new ynab.API(parsedConfig.ynab.accessToken);

function getFormatterForBudget(budget) {
  /* data on budget: 
    "currency_format": {
      "iso_code": "EUR",
      "example_format": "123.456,78",
      "decimal_digits": 2,
      "decimal_separator": ",",
      "symbol_first": true,
      "group_separator": ".",
      "currency_symbol": "€",
      "display_symbol": true
    }
  */
  
  return new Intl.NumberFormat(
    parsedConfig.output.locale, 
    {
      style: 'currency',
      currency: budget.currency_format.iso_code,
      minimumFractionDigits: budget.currency_format.decimal_digits,
    }
  );
}

async function getBudgetByNameOrId(nameOrId) {
  let budgets = cache.budgets;
  if (!budgets) {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    budgets = budgetsResponse.data.budgets;
    cache.budgets = budgets;
  }

  for (let budget of budgets) {
    if (budget.name == nameOrId || budget.id == nameOrId) {
      return budget;
    }
  }

  throw new Error('no budget found with name "' + name + '"')
}

async function getAccountsForBudgetId(budgetId) {
  let accounts = cache.accounts[budgetId];
  if (!accounts) {
    const accountsResponse = await ynabAPI.accounts.getAccounts(budgetId);
    accounts = accountsResponse.data.accounts;
    cache.accounts[budgetId] = accounts;
  }
  return accounts;
}

async function getCategoriesForBudgetId(budgetId) {
  let categories = cache.categories[budgetId];
  if (!categories) {
    const categoriesResponse = await ynabAPI.categories.getCategories(budgetId);
    categories = categoriesResponse.data.category_groups;
    cache.categories[budgetId] = categories;
  }
  return categories;
}

async function getData(budgetNameOrId) {
  const budget = await getBudgetByNameOrId(budgetNameOrId);

  const categoriesData = await getCategoriesForBudgetId(budget.id);
  const accountsData = await getAccountsForBudgetId(budget.id);

  const formatter = getFormatterForBudget(budget);

  let budgetCategories = {};
  for (let categoryData of categoriesData) {
    for (var category in parsedConfig.ynab.categories) {
      if (categoryData.name == category || categoryData.id == category) {
        for (let subcategoryData of categoryData.categories) {
          for (let subcategory of parsedConfig.ynab.categories[category]) {
            if (subcategoryData.name == subcategory || subcategoryData.id == subcategory) {
              if (!budgetCategories.hasOwnProperty(subcategory)) {
                budgetCategories[subcategory] = {}
              }
              budgetCategories[subcategory].activity = subcategoryData.activity / 1000 * -1;
            }
          }
        }
      }
    }
  }

  let totals = {};
  let accounts = {};
  let networth = 0;
  for (let account of accountsData) {
    for (let acct of parsedConfig.ynab.accounts) {
      if (account.name == acct) {
        account.balance = account.balance / 1000
        balance = account.balance
        networth = networth + balance;
        acct_type = account.type
        if (totals.hasOwnProperty(account.type)) {
          totals[acct_type] = totals[acct_type] + balance
        }
        else {
          totals[acct_type] = balance
          accounts[acct_type] = []
        }
        accounts[acct_type].push(account)
      }
    }
  }

  data = '----- ' + moment().format('ddd, MMM D') + ' -----\n'
  data = data + ('NET WORTH: ' + formatter.format(networth) + '\n')
  for (var key in totals) {
    data = data + ('\n' + key + ': ' + formatter.format(totals[key]) + '\n')
    accounts[key].forEach(function (acct) {
      data = data + ('  ' + acct.name + ': ' + formatter.format(acct.balance) + '\n')
    })
  }

  data = data + '\n---- SPENDING ----\n'

  for (var key in budgetCategories) {
    data = data + key + ': ' + formatter.format(budgetCategories[key].activity) + '\n'
  }

  return data;
}

async function getDataAndSend(budgetName) {
  const data = await getData(budgetName);
  
  console.log('data to be sent', data)

  if (parsedConfig.output.synology.webhook) {
    await sendToSynology(data);
  }
  if (parsedConfig.output.telegram.bot_token) {
    await sendToTelegram(data);
  }
}

async function sendToSynology(data) {
  const response = await rq({
    method: 'POST',
    uri: parsedConfig.output.synology.webhook,
    form: {
      payload: JSON.stringify({ "text": data })
    }
  });
  console.log('synology response', response);
}

async function sendToTelegram(data) {
  const response = await rq({
    method: 'POST',
    uri: 'https://api.telegram.org/bot' + parsedConfig.output.telegram.bot_token + '/sendMessage',
    json: { 
      'chat_id': parsedConfig.output.telegram.destination_id,
      'text': data,
      'disable_notification': true,
    },
  });
  console.log('telegram response', response);
}

getDataAndSend(parsedConfig.ynab.defaultBudgetNameOrId).then(() => {
  console.log('success');
}, error => {
  console.error('ERROR', error);
});
