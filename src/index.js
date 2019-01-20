const config = require('config');
const ynab = require("ynab");
const axios = require('axios')
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
const accessToken = config.get('ynab.key')
const ynabAPI = new ynab.API(accessToken);
const defaultBudget = config.get('ynab.budget')
const rq = require('request-promise');
const qs = require('qs');
const dollarFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
})
const moment = require('moment');

let budgetId;
async function getBudgetByName(name) {
  const budgetsResponse = await ynabAPI.budgets.getBudgets();
  const budgets = budgetsResponse.data.budgets;
  for (let budget of budgets) {
    if (budget.name == defaultBudget) {
        return budget.id;
    }
  }
}

async function getDataAndSend(defaultBudget) {
  getBudgetByName(defaultBudget).then(async (id)=>{
    try {
      let budgetCategories = {};
      const categoriesResponse = await ynabAPI.categories.getCategories(id);
      const categoriesData = categoriesResponse.data.category_groups;
      for (let categoryData of categoriesData) {
        for (var category in config.get('ynab.categories')) {
            if (categoryData.name == category) {
              for (let subcategoryData of categoryData.categories) {
                for (let subcategory of config.get('ynab.categories')[category]) {
                  if (subcategoryData.name == subcategory) {
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

      const accountsResponse = await ynabAPI.accounts.getAccounts(id);
      const accountsData = accountsResponse.data.accounts;
      let totals = {};
      let accounts = {};
      let networth = 0;
      for (let account of accountsData) {
        for (let acct of config.get('ynab.accounts')) {
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
      data = data + ('NET WORTH: ' + dollarFormatter.format(networth) + '\n')
      for (var key in totals) {
        data = data + ('\n' + key + ': ' + dollarFormatter.format(totals[key]) + '\n')
        accounts[key].forEach(function(acct) {
          data = data + ('  ' + acct.name + ': ' + dollarFormatter.format(acct.balance) + '\n')
        })
      }

      data = data + '\n---- SPENDING ----\n'

      for (var key in budgetCategories) {
        data = data + key + ': ' + dollarFormatter.format(budgetCategories[key].activity) + '\n'
      }

      console.log(data)

      rq({
	    method: 'POST',
	    uri: config.get('synology_chat.webhook'),
	    form: {
            payload: JSON.stringify({"text": data})
        }
      })
      .then((response) => {
        console.log(response)
      })
      .catch((error) => {
        console.error(error)
      })
    }
    catch(error) {
      console.error('ERROR: ' + error);
    }
  })
}

getDataAndSend(defaultBudget);
