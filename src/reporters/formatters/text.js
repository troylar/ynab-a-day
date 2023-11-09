function format(data) {

    let text = '';
    for (const entry of data) {
        if (entry.text) {
            text += entry.text + '\n';
        }
        if (entry.separator) {
            for (let i = 0; i < entry.separator; i ++) {
                text += '\n';
            }
        }
        if (entry.header) {
            text += '----- ' + entry.header + ' -----' + '\n';
        }
    }

    return text;
}

module.exports = format;
