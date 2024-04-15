const express = require('express');
const cors = require('cors');
var {google} = require('googleapis')
const request = require('request')
var fs = require('fs')
const axios = require("axios");
require('dotenv').config()

const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS

let CACHED_ACCESS = new Map();

const app = express();

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
        }
    } catch (error) {
        if (error.response.status === 401) {
            return res.sendStatus(401);
        }
        return next(error);
    }
    return next(new Error('403 doesnt allowed'));
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

/*app.post('/delete_channel', authenticateToken, (req, res) => {
    let url = process.env.DELETE_CHANNEL
    let channel = req.body.channel
    let data = JSON.stringify({
        "channel": channel
    })
    jwtClient.authorize(function (err, _token) {
        if (err) {
            console.log("ERROR: ")
            console.log(err)
            return err
        } else {
            request(
                {
                    url: url,
                    method: 'POST',
                    body: data,
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
                        res.setHeader('Content-Type', 'application/json');
                        res.send(body);
                    }
                }
            );
        }
    });
})*/

app.post('/create_backfill', authenticateToken, (req, res) => {
    let url = process.env.ADD_CHANNEL
    let channel = req.body.channel
    let data = JSON.stringify({
        "channel": channel
    })
    jwtClient.authorize(function (err, _token) {
        if (err) {
            console.log("ERROR: ")
            console.log(err)
            return err
        } else {
            request(
                {
                    url: url,
                    method: 'POST',
                    body: data,
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
                        res.setHeader('Content-Type', 'application/json');
                        res.send(body);
                    }
                }
            );
        }
    });
})



// Визначення порту і запуск сервера
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});