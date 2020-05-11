// coronautils.js
// ========
var moment = require('moment')

module.exports = {
    getMonthName: function (momentDate) {
      // whatever

      var localeData = moment.updateLocale('en', {
        nominative:
           'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        subjective: 
           'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months: function (momentToFormat, format) {
           if (/^MMMM/.test(format)) {
              console.log(this._nominative);
              return this._nominative[momentToFormat.month()];
           } else {
              return this._subjective[momentToFormat.month()];
           }
        }
     });
     var m = localeData.months(momentDate, "MMMM");

     console.log(m);
     return m;

    },


    bar: function () {
      // whatever
    }
  };
  