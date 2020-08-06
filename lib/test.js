const query = require('./query');

query.get_attender(11, (err, list) => {
    console.log(err);
    console.log(list);
});