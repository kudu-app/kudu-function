const functions = require('firebase-functions');
const showdown = require('showdown');

const converter = new showdown.Converter();
const itemRef = "/item/{itemId}"

/**
 * Process markdown tags from item.notes field and update
 * the value to include the html version of item.notes.
 */
exports.makeHtmlNotes = functions.database.ref(itemRef)
    .onWrite(event => {
      const item = event.data.val();
      return event.data.adminRef.update({
        notes_md: converter.makeHtml(item.notes),
      });
});
