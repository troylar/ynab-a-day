const ynab = require("ynab");

class Client {
    _ynabAPI;
    _cache;

    constructor(token) {
        if (!token) {
            throw new Error('missing required API token');
        }
        this._cache = {
            budgets: null,
            accounts: {},
            categories: {},
        };
        this._ynabAPI = new ynab.API(token);
    }

    getNumberFormatSpecificationsForBudget(budget) {
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

        return {
            style: 'currency',
            currency: budget.currency_format.iso_code,
            minimumFractionDigits: budget.currency_format.decimal_digits,
        };
    }

    async getBudgetMatching(matcher) {
        let budgets = this._cache.budgets;
        if (!budgets) {
            const budgetsResponse = await this._ynabAPI.budgets.getBudgets();
            budgets = budgetsResponse.data.budgets;
            this._cache.budgets = budgets;
        }

        for (let budget of budgets) {
            if (matcher(budget)) {
                return budget;
            }
        }

        return null;
    }

    async getAccountsForBudgetId(budgetId) {
        let accounts = this._cache.accounts[budgetId];
        if (!accounts) {
            const accountsResponse = await this._ynabAPI.accounts.getAccounts(budgetId);
            accounts = accountsResponse.data.accounts;
            this._cache.accounts[budgetId] = accounts;
        }
        return accounts;
    }

    async getCategoriesForBudgetId(budgetId) {
        let categories = this._cache.categories[budgetId];
        if (!categories) {
            const categoriesResponse = await this._ynabAPI.categories.getCategories(budgetId);
            categories = categoriesResponse.data.category_groups;
            this._cache.categories[budgetId] = categories;
        }
        return categories;
    }

}

module.exports = Client;