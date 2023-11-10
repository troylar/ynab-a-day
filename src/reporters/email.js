const moment = require('moment');
const { createTransport } = require('nodemailer');

const textFormatter = require('./formatters/text');
const htmlFormatter = require('./formatters/html');

async function report(rootConfig, data) {
    const conf = rootConfig.output.email;
    if (!conf.enabled) {
        return null;
    }

    const getParam = n => {
        return conf[n];
    }

    const requireParam = n => {
        const v = conf[n];
        if (!v) {
            throw new Error('required parameter "' + n + '" is missing in email output configuration');
        }
        return v;
    }

    const host = requireParam('host');
    const portStr = getParam('port');
    const user = getParam('user');
    const pass = getParam('pass');
    const from = requireParam('from');
    const fromName = getParam('fromName') || 'YNAB digest';
    const to = requireParam('to');
    let subject = getParam('subject') || 'Your YNAB digest for $today';

    let port = 587;
    if (portStr) {
        port = parseInt(portStr, 10);
    }

    let text = textFormatter(data);
    let html = htmlFormatter(data);

    subject = subject.replaceAll(
        '$today',
        moment().format('ddd, MMM D'),
    );

    const transporter = createTransport({
        host,
        port,
        auth: user ? {
            user: user,
            pass: pass,
        } : null,
    });

    const response = await transporter.sendMail({
        from: {
            address: from,
            name: fromName,
        },
        to,
        subject,
        text,
        html,
    });

    return response;
}

module.exports = report;
