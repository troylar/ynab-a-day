# ynab-a-day
A simple and customizable YNAB daily report for your significant other who doesn't care about budgeting, but whom you care about keeping informed

##Overview
For decades I have been a financial planning fanatic. Going back to Quicken for DOS in the late 80s, it's been a crazy fun passion of mine and now with YNAB, even more so.

However, my very busy professional wife doesn't share the same love of financial management. She's frugal, but loses interest quickly when we start going over spreadsheets and reports. She won't install YNAB and even if she did, she just wouldn't take the time to look at the data. It's not that she doesn't care, it's just that she trusts me to handle the finances and to inform her when there are concerns.

There are times, though, when she does pop in to look at finances. These moments can be a bit stressful because she hasn't been involved. And when you're not plugged in consistently, you don't have context around the financial situation and that can cause some distress if you have different expectations.

That's why I wrote `ynab-a-day`. It's a simple script that I can run once a day and it will send a brief snapshot of our finances to a chat channel using the data from YNAB. Right now it's integrated with [Synology Chat](https://www.synology.com/en-us/dsm/feature/chat "Synology Chat") using a webhook, but it's super-simple to add additional integration to other messaging solutions.

## Philosophy

The goals of this project for my significant other:

  - Provide complete transparency into all of our finances on a daily basis
  - Show all of our account balances
  - Highlight specific categories that we should be monitoring
  - Show all transactions in the past 24 hours across all accounts (*in progress*)
  - Allow for customization presentation of the data (*in progress*)
  - Provide this data via Synology Chat, Slack or other messaging solution that allows for non-intrusive multiple channels, so that it doesn't get annoying

## Installation
1. Clone this repo:
 
    $ git clone https://github.com/troylar/ynab-a-day.git
    $ cd ynab-a-day
    $ npm install

2. Create an [API token](https://api.youneedabudget.com "API token")

3. Create a new config file:

    $ cp ./config/default.js.example ./config/default.js

4. Modify the config file you just created.

   * Replace `<YNAB API Key>` with your key you just created in step #2
   * Replace the `accounts` section with a list of all the accounts you want to display
   * Replace the `categories` section with a list of all the categories you want to display
   * If you have Synology Chat, create a webhook and replace `<Webhook>`, or just take this out and add your own

## Next Steps
I would love for others to add additional integrations (Slack, HipChat, etc.). The value here is to allow significant others to have visibility without being email-spammed or overwhelmed with notifications.