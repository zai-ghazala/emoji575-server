const express = require('express'); 
const app = express();
const port = 3000
const cors = require('cors')
const syl = require('syllabificate');

var corsOptions = {
  origin: ['https://emoji575.zaiz.ai', 'https://www.emoji575.zaiz.ai', 'http://127.0.0.1:5173', 'http://localhost:5173'],
  optionsSuccessStatus: 200 
}

function validateHaiku(text) {
  let lines = text?.trim().split(/\r?\n/)
  let errored = false

  if (lines.length !== 3) {
    errored = true
  } else {
    lines.forEach((line, idx) => {
      line = line.replace('’', '\'')
      const s = syl.countSyllables(line)
      const allowed = idx !== 1 ? 5 : 7
      const isValid = s === allowed
      if (!isValid) {
        errored = true
      }
    })
  }
  return errored;
}

async function getValidHaiku(text) {
  let haiku;
  do {
    haiku = await requestHaiku(text)
  } while (validateHaiku(haiku))
  return haiku;
}

function smarten(string)  {
  string = string.replace(/(^|[-\u2014/([{"\s])'/g, '$1\u2018'); // opening singles
  string = string.replace(/'/g, '\u2019'); // closing singles & apostrophes
  string = string.replace(/(^|[-\u2014/([{\u2018\s])"/g, '$1\u201c'); // opening doubles
  string = string.replace(/"/g, '\u201d'); // closing doubles
  string = string.replace(/--/g, '\u2014'); // em-dashes

  return string;
};

async function requestHaiku(text) {
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.RAPID_API_HOST,
    },
    body: `{"model":"gpt-3.5-turbo","messages":[{"role":"user","content": "Generate a haiku from the following keywords: ${text}."}]}`,
  }
  let response = await fetch(process.env.RAPID_API_URL, options)
  let json = await response.json()
  console.log(json)
  let haiku = json.choices[0].message.content
  return smarten(haiku);
}



if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config()
}
app.get('/', async (req, res) => {
  res.send('Emoji 575')
})
app.get('/api', cors(corsOptions), async (req, res) => {

  if (!req.query.text) {
    return res.send({error: 'You must provide keywords'})
  }
  else {
    const result = await requestHaiku(req.query.text);

    if (!req.query.response_url) {
      res.send(result)}
    else {
      res.send({response_type: "in_channel", text: result})
  }}})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

module.exports = app
