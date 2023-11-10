function format(data) {
    const nl = '<br>';

    let text = '';
    for (const entry of data) {
        if (entry.text) {
            text += escapeHtml(entry.text) + nl;
        }
        if (entry.separator) {
            for (let i = 0; i < entry.separator; i ++) {
                text += nl;
            }
        }
        if (entry.header) {
            text += '<b>' + escapeHtml(entry.header) + '</b>' + nl;
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
