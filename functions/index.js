const functions = require('firebase-functions');

const itemRef = "/item/{itemId}"
const TMP_DIR = '/tmp/';

/**
 * Process markdown tags from item.notes field and update
 * the value to include the html version of item.notes.
 */
exports.processMarkdown = functions.database.ref(itemRef)
    .onWrite(event => {
      const showdown = require('showdown');
      const converter = new showdown.Converter();

      const item = event.data.val();
      if (item === null) {
        return
      }
      return event.data.adminRef.update({
        notes_md: converter.makeHtml(item.notes),
      });
});

/**
 * Capture the screenshot from item.URL field and
 * generate the thumbnail.
 */
exports.generateThumbnail = functions.database.ref(itemRef)
    .onWrite(event => {
      const gcs = require('@google-cloud/storage')();
      const mkdirp = require('mkdirp-promise');
      const spawn = require('child-process-promise').spawn;
      const pageres = require('pageres');

      const item = event.data.val();
      if (item === null) {
        return
      }

      const prefix = 'thumb_';
      const fileName = `${prefix}${event.params.itemId}`
      const filePath = `${TMP_DIR}${fileName}.png`
      const dest = `${event.params.itemId}/thumb.png`

      console.log("File path: " + filePath)

      const bucket = gcs.bucket(functions.config().bucket.name)
      console.log("preparing to uploading to: " + functions.config().bucket.name)
      mkdirp(TMP_DIR).then(() => {
        console.log("create temporary directory at: " + TMP_DIR)
        new pageres({delay: 3, filename: fileName})
          .src(item.url, ['1200x1000'], {crop: true})
          .dest(TMP_DIR)
          .run()
          .then(() => {
            console.log("successfully capturing screenshoot on: " + item.url);
            bucket.upload(filePath, {
              destination: dest
            }).then(() => {
              console.log('thumbnail uploaded to', filePath);
            });
          });
      });
});
