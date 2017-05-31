(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.index = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var Vreme = function () {
    function Vreme(options) {
      _classCallCheck(this, Vreme);

      // Default options, should merge them with passed options in future
      this.options = {
        monthNames: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
        dayNames: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      };

      // Use Date prototype,
      // ie. `let date = new Date(); date.format_like('2015/11/22');`
      if (options && options.usePrototype) {
        // Arrow functions don't work here because we need `this` from
        // both class and function
        var self = this;
        Date.prototype.formatLike = function (formatString) {
          return self.format(this, formatString);
        };
      }

      // Define all regular expressions
      this.regex = {
        MONTHNAMES_REGEXP: new RegExp('^(' + this.options.monthNames.join('|') + ')$', 'i'),
        MONTHNAMES_ABBR_REGEXP: new RegExp('^(' + this.options.monthNames.map(function (month) {
          return month.substr(0, 3);
        }).join('|') + ')$', 'i'),
        DAYNAMES_REGEXP: new RegExp('^(' + this.options.dayNames.join('|') + ')$', 'i'),
        DAYNAMES_ABBR_REGEXP: new RegExp('^(' + this.options.dayNames.map(function (day) {
          return day.substr(0, 3);
        }).join('|') + ')$', 'i'),
        DAYNAMES_SHORT_REGEXP: new RegExp('^(' + this.options.dayNames.map(function (day) {
          return day.substr(0, 2);
        }).join('|') + ')$', 'i'),
        ONE_DIGIT_REGEXP: /^\d{1}$/,
        TWO_DIGIT_REGEXP: /^\d{2}$/,
        GREATER_THAN_TWELVE_REGEXP: /^(?:1[3-9])|(?:2\d)$/,
        FOUR_DIGIT_REGEXP: /^\d{4}$/,
        ORDINAL_DAY_REGEXP: /^(\d{1,2})(st|nd|rd|th)$/,
        TIME_REGEXP: /(\d{1,2})(:)(\d{2})(\s*)(:)?(\d{2})?(\s*)?([ap]m)?/i
      };

      // Call reset method first, because we want a clean start
      this._reset();
    }

    // Main function


    _createClass(Vreme, [{
      key: 'format',
      value: function format(date, formatString) {
        var _this = this;

        // Call reset method first, because we want a clean start
        this._reset();

        // Split format string by time
        var time = formatString.split(this.regex.TIME_REGEXP);
        // Than get first element from array, because it should contain date
        var before = time.splice(0, 1)[0];
        // And the last one because it should stay the same
        var after = time.pop();
        // When there's no time, last element is empty, so we need to check that too
        after = after || '';

        // Split date and format each part
        var formatedDate = before.split(/\b/).map(function (partial) {
          return _this.formatDate(date, partial);
        });
        var formatedTime = [];

        if (time.length) formatedTime = time.map(function (partial, index) {
          return _this.formatTime(date, partial, index, time);
        });

        // Merge and return the result
        // Time should be parsed too, but at the moment we are just returning it
        return formatedDate.join('') + formatedTime.join('') + after;
      }
    }, {
      key: 'ordinalSuffix',
      value: function ordinalSuffix(day) {

        var j = day % 10,
            k = day % 100;

        if (j == 1 && k != 11) return day + 'st';

        if (j == 2 && k != 12) return day + 'nd';

        if (j == 3 && k != 13) return day + 'rd';

        return day + 'th';
      }
    }, {
      key: 'formatDate',
      value: function formatDate(date, format) {
        var _this2 = this;

        // Best match function
        var bestMatch = function bestMatch(number, date, twoDigits) {
          // There is a better way to do this, but this should work now

          // If it's between 13 and 31 and day is not yet set
          if (number > 12 && number < 32 && !_this2.matches.day) {
            _this2.matches.day = true;
            return ('0' + date.getDate()).slice(-2);
          }

          // If it's > 31 and year is not yet set
          if (number > 12 && !_this2.matches.year || number > 31) {
            _this2.matches.year = true;
            return date.getFullYear() + '';
          }

          // Then first check if month is set
          if (!_this2.matches.month) {
            _this2.matches.month = true;
            var month = date.getMonth() + 1;
            if (twoDigits) return ('0' + month).slice(-2);
            return month + '';
          }

          // Then day
          if (!_this2.matches.day) {
            _this2.matches.day = true;
            if (twoDigits) return ('0' + date.getDate()).slice(-2);
            return date.getDate() + '';
          }

          // And finally year
          if (!_this2.matches.year) {
            _this2.matches.year = true;
            if (twoDigits) return ('0' + date.getFullYear()).slice(-2);
            return date.getFullYear() + '';
          }

          // Otherwise reset object
          _this2._reset();

          // Then call the function again
          return bestMatch(number, date);
        };

        // Check if format string is full month name
        if (format.match(this.regex.MONTHNAMES_REGEXP)) {
          this.matches.month = true;
          return this._correctCase(format, this.options.monthNames[date.getMonth()]);
        }

        // Check if format string is short month name
        if (format.match(this.regex.MONTHNAMES_ABBR_REGEXP)) {
          this.matches.month = true;
          return this._correctCase(format, this.options.monthNames[date.getMonth()].substr(0, 3));
        }

        // Check if format string is full day name
        if (format.match(this.regex.DAYNAMES_REGEXP)) {
          return this._correctCase(format, this.options.dayNames[date.getDay()]);
        }

        // Check if format string is 3 letter day name
        if (format.match(this.regex.DAYNAMES_ABBR_REGEXP)) {
          return this._correctCase(format, this.options.dayNames[date.getDay()].substr(0, 3));
        }

        // Check if format string is 2 letter day name
        if (format.match(this.regex.DAYNAMES_SHORT_REGEXP)) {
          return this._correctCase(format, this.options.dayNames[date.getDay()].substr(0, 2));
        }

        // Check if format string is year (4 digits)
        if (format.match(this.regex.FOUR_DIGIT_REGEXP)) {
          this.matches.year = true;
          return date.getFullYear() + '';
        }

        // Check if format string is day with ordinal sufix
        if (format.match(this.regex.ORDINAL_DAY_REGEXP)) {
          this.matches.day = true;
          return this.ordinalSuffix(date.getDate());
        }

        // This is a bit more complicated
        // If format string is two digits, then
        if (format.match(this.regex.TWO_DIGIT_REGEXP)) {
          // Parse it as an integer
          var number = parseInt(format, 10);

          // Check if it's obvious year
          if (number > 31 && number < 100) {
            this.matches.year = true;
            return (date.getFullYear() + '').substring(2, 4);
          }

          // Otherwise try to find the best match (it could be year, month or day)
          return bestMatch(number, date, true);
        }

        // This is a bit more complicated too
        // If format string is just one digits, then
        if (format.match(this.regex.ONE_DIGIT_REGEXP)) {
          // Parse it as an integer
          var _number = parseInt(format, 10);

          // And try to find the best match (it could be month, day or maybe year,
          // but that's a bit unlikely)
          return bestMatch(_number, date);
        }

        // Otherwise just return format, because it is probably just a text
        return format;
      }
    }, {
      key: 'formatTime',
      value: function formatTime(dateTime, format, index, fullTime) {
        var _this3 = this;

        var getAmPm = function getAmPm(format, hours) {
          var ampm = hours < 12 ? 'am' : 'pm';
          if (_this3._isAllCaps(format)) return ampm.toUpperCase();
          return ampm;
        };

        var getCivilianHours = function getCivilianHours(dateTime) {
          var hours = dateTime.getHours();

          if (hours === 0) return 12;else if (hours > 12) return hours - 12;else return hours;
        };

        if (index === 0 && format.match(this.regex.ONE_DIGIT_REGEXP)) return getCivilianHours(dateTime);

        if (index === 0 && format.match(this.regex.GREATER_THAN_TWELVE_REGEXP)) return ('0' + dateTime.getHours()).slice(-2);

        if (index === 0 && format.match(this.regex.TWO_DIGIT_REGEXP)) return ('0' + getCivilianHours(dateTime)).slice(-2);

        if (index === 2 && format.match(this.regex.TWO_DIGIT_REGEXP)) return ('0' + dateTime.getMinutes()).slice(-2);

        if (format && index === 5 && format.match(this.regex.TWO_DIGIT_REGEXP)) return ('0' + dateTime.getSeconds()).slice(-2);

        if (format && index === 7) return dateTime.getHours() < 12 ? this._correctCase(format, 'am') : this._correctCase(format, 'pm');

        return format;
      }
    }, {
      key: '_reset',
      value: function _reset() {
        // Reset an object we are using for a best match
        this.matches = {
          month: false,
          day: false,
          year: false
        };
      }
    }, {
      key: '_isCapital',
      value: function _isCapital(str) {
        return str.charAt(0) === str.charAt(0).toUpperCase();
      }
    }, {
      key: '_isLowercase',
      value: function _isLowercase(str) {
        return str === str.toLowerCase();
      }
    }, {
      key: '_isAllCaps',
      value: function _isAllCaps(str) {
        return str === str.toUpperCase();
      }
    }, {
      key: '_toCapital',
      value: function _toCapital(str) {
        return str.charAt(0).toUpperCase() + str.slice(1, str.length);
      }
    }, {
      key: '_correctCase',
      value: function _correctCase(format, str) {
        if (this._isLowercase(format)) return str.toLowerCase();
        if (this._isAllCaps(format)) return str.toUpperCase();
        if (this._isCapital(format)) return this._toCapital(str);
        return str;
      }
    }]);

    return Vreme;
  }();

  exports.default = Vreme;
});
