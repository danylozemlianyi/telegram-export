const express = require('express');
const cors = require('cors');
var {google} = require('googleapis')
const request = require('request')
var fs = require('fs')
const axios = require("axios");
require('dotenv').config({ path: `.env.back` })
var bodyParser = require('body-parser')

const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS.split(',');

let CACHED_ACCESS = new Map();

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

function readJsonFileSync(filepath, encoding) {

    if (typeof (encoding) == 'undefined') {
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

let privateKey = readJsonFileSync('.privateKey.json');

// Налаштування CORS
app.use(cors());
let jwtClient = new google.auth.JWT(
    privateKey.client_email,
    null,
    privateKey.private_key,
    process.env.CORS
)

let testCache = null;

async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (CACHED_ACCESS.has(token)) {
            return next();
        }
        let response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        if (ALLOWED_EMAILS.includes(response.data.email)) {
            CACHED_ACCESS.set(token, response.data.email)
            return next();
        } else {
            console.log("403 response")
            return res.sendStatus(403);
        }
    } catch (error) {
        if (error.response.status === 401) {
            return res.sendStatus(401);
        }
        return next(error);
    }
}

app.get('/read_channels', authenticateToken, (req, res) => {
    if (testCache === null) {
        let url = process.env.READ_CHANNELS

        jwtClient.authorize(function (err, _token) {
            if (err) {
                console.log("ERROR: ")
                console.log(err)
                return err
            } else {
                request(
                    {
                        url: url,
                        headers: {
                            "Authorization": "Bearer " + _token.id_token
                        }
                    },
                    function (err, response, body) {
                        if (err) {
                            console.log("ERROR 2")
                            console.log(err)
                            return err
                        } else {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(body);
                            testCache = body;
                        }
                    }
                );
            }
        });
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(testCache);
    }
})

app.post('/create_backfill', authenticateToken, (req, res) => {
    let url = process.env.CREATE_BACKFILL
    let data = {
        'trigger_date': req.body.singleDate.substring(0, 10),
        'job_details': {
            'from_date': req.body['dateRange']['start'].substring(0, 10),
            'to_date': req.body['dateRange']['end'].substring(0, 10)
        }
    };
    jwtClient.authorize(function (err, _token) {
        if (err) {
            console.log("ERROR: ")
            console.log(err)
            return err
        } else {
            request(
                {
                    uri: url,
                    method: 'POST',
                    body: data,
                    json: true,
                    headers: {
                        "Authorization": "Bearer " + _token.id_token,
                        "Content-Type": "application/json"
                    }
                },
                function (err, response, body) {
                    if (err) {
                        console.log("ERROR 2")
                        console.log(err)
                        return err
                    } else {
                        console.log(body)
                        res.setHeader('Content-Type', 'application/json');
                        res.send(body);
                    }
                }
            );
        }
    });
})

app.delete('/channel/:id', authenticateToken, (req, res) => {
    let url = process.env.CHANNEL
    let id = req.params.id;

        let data = {
            'id': id
        };
        jwtClient.authorize(function (err, _token) {
            if (err) {
                console.log("ERROR: ")
                console.log(err)
                return err
            } else {
                request(
                    {
                        url: url,
                        method: 'DELETE',
                        body: data,
                        json: true,
                        headers: {
                            "Authorization": "Bearer " + _token.id_token,
                            "Content-Type": "application/json"
                        }
                    },
                    function (err, response, body) {
                        if (err) {
                            console.log("ERROR 2")
                            console.log(err)
                            return err
                        } else {
                            console.log(body)
                            res.setHeader('Content-Type', 'application/json');
                            res.send(body);
                        }
                    }
                );
            }
        });
})

let create_or_update_channel = (req, res, type) => {
    let url = process.env.CHANNEL
    let id = req.params.id;
    let lang = req.body.lang;
    let segment = req.body.segment;
    console.log('id: ' + id);
    console.log('lang: ' + lang);
    console.log('segment: ' + segment);
    let data = {
        'id': id,
        'lang': lang,
        'segment': segment
    };
    jwtClient.authorize(function (err, _token) {
        if (err) {
            console.log("ERROR: ")
            console.log(err)
            return err
        } else {
            request(
                {
                    url: url,
                    method: type,
                    body: data,
                    json: true,
                    headers: {
                        "Authorization": "Bearer " + _token.id_token,
                        "Content-Type": "application/json"
                    }
                },
                function (err, response, body) {
                    if (err) {
                        console.log("ERROR 2")
                        console.log(err)
                        return err
                    } else {
                        console.log(body)
                        res.setHeader('Content-Type', 'application/json');
                        res.send(body);
                    }
                }
            );
        }
    });
}
app.post('/channel/:id', authenticateToken, (req, res) => create_or_update_channel(req, res, 'POST'))
app.put('/channel/:id', authenticateToken, (req, res) => create_or_update_channel(req, res, 'PUT'))


// Визначення порту і запуск сервера
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});