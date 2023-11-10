const rq = require('request-promise');

const formatter = require('./formatters/text');

async function report(rootConfig, data) {
    const conf = rootConfig.output.webhook;
    if (!conf.enabled) {
        return null;
    }

    const requireParam = n => {
        const v = conf[n];
        if (!v) {
            throw new Error('required parameter "' + n + '" is missing in webhook output configuration');
        }
        return v;
    }

    const uri = requireParam('url');

    let text = formatter(data);

    const response = await rq({
        method: 'POST',
        uri,
        body: text ,
    });
    
    return response;
}

module.exports = report;
