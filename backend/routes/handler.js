const { convert } = require('convert-svg-to-png');
const express = require('express');
const router = express.Router();

router.get('/convert',(req, res) => {
    console.log('tett');
    /*const png = await convert(req.body);
    res.set('Content-Type', 'image/png');
    res.send(png);*/
    //res.end(JSON.stringify(str));
})

module.exports = router;