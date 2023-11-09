function format(data) {

    // see https://core.telegram.org/bots/api#formatting-options for help
    let text = '';
    for (const entry of data) {
        if (entry.text) {
            text += escapeHtml(entry.text) + '\n';
        }
        if (entry.separator) {
            for (let i = 0; i < entry.separator; i ++) {
                text += '\n';
            }
        }
        if (entry.header) {
            text += '<strong>' + escapeHtml(entry.header) + '</strong>' + '\n';
        }
    }

    return text;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;");
 }

module.exports = format;
