const rq = require('request-promise');

const formatter = require('./formatters/text');

async function report(rootConfig, data) {
    const conf = rootConfig.output.synology;
    if (!conf.enabled) {
        return null;
    }

    const requireParam = n => {
        const v = conf[n];
        if (!v) {
            throw new Error('required parameter "' + n + '" is missing in synology output configuration');
        }
        return v;
    }

    const webhook = requireParam('webhook');

    let text = formatter(data);

    const response = await rq({
        method: 'POST',
        uri: webhook,
        form: {
          payload: JSON.stringify({ "text": text }),
        }
    });
    
    return response;
}

module.exports = report;
