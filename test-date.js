const { formatInTimeZone } = require('date-fns-tz');

console.log(formatInTimeZone(new Date(), 'Asia/Manila', "yyyy-MM-01T00:00:00XXX"));
