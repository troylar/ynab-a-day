const formatter = require('./formatters/text');

async function report(rootConfig, data) {
    const conf = rootConfig.output.stdout;
    if (!conf.enabled) {
        return null;
    }

    const requireParam = n => {
        const v = conf[n];
        if (!v) {
            throw new Error('required parameter "' + n + '" is missing in stdout output configuration');
        }
        return v;
    }

    const format = ('' + requireParam('format')).toLowerCase();

    switch (('' + format).toLowerCase()) {
        case 'json':
            return reportInJSONFormat(data);
        case 'text':
            return reportInTextFormat(data);
        default:
            throw new Error('unexpected format "' + format + '"');ù
    }

    return true;
}

async function reportInJSONFormat(data) {
    const wrapped = {
        data: data,
    };

    console.log(JSON.stringify(wrapped, null, 2));

    return true;
}

async function reportInTextFormat(data) {

    let text = formatter(data);

    console.log(text);

    return true;
}

module.exports = report;
