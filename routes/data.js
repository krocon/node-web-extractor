const cheerio = require('cheerio');
const express = require('express');
const router = express.Router();


const parseBody = (req) => {
  if (req.body.externalUrl) {
    return req.body;
  }
  if (req.body.data) {
    return JSON.parse(req.body.data);
  }
  try {
    return JSON.parse(req.body);
  } catch (e) {
    console.error(e, e.message);
  }
  return null;
};

router.post('/v1', (req, res, next) => {
  // console.error('anfang>\n', req.body);

  const ret = {startedAt: Date.now()};

  const errorHandler = (e) => {
    console.error(e);
    console.info('ret', ret);
    res.jsonp({statusCode: res.statusCode, message: e.message, name: e.name});
  };

  let options = parseBody(req);
  if (!options || !options.externalUrl) {
    errorHandler({statusCode: 400, name: 'error', message: 'Problem: Cannot parse ' + req.body});
    return;
  }

  const protocol = options.externalUrl.split(':')[0];
  const httpModule = require(protocol);

  if (!options.targetKey) {
    options.targetKey = 'data';
  }

  const getReq = httpModule.get(options.externalUrl, httpsRes => {
    const data = [];

    httpsRes.on("data", (chunk) => {
      data.push(chunk);
    });

    httpsRes.on('end', (o) => {
      const buffer = Buffer.concat(data);
      let text = buffer.toString('UTF-8');
      if (!text || !text.length) {
        ret.responseStatusCode = httpsRes.statusCode;
        ret.responseHeaders = httpsRes.headers;
        res.jsonp(ret);
        return;
      }

      if (options.debugging) {
        ret.html = text;
        ret.options = options;
      }

      if (options.replacePattern) {
        const re = new RegExp(options.replacePattern, "g");
        text = text.replace(re, '');
      }

      if (!text) {
        ret.replacePattern = options.replacePattern;
        ret.error = 'Nothing found! textAfterReplace:' + textAfterReplace;
        ret.html = text;
        res.jsonp(ret);
        return;
      }

      if (options.replacements) {
        for (let i = 0; i < options.replacements.length; i++) {
          const replacement = options.replacements[i];
          const re = new RegExp(replacement.pattern, "g");
          text = text.replace(re, replacement.target);
        }
      }

      if (options.jqueryPattern) {
        const $ = cheerio.load(text);
        const $hit = $(options.jqueryPattern);
        const hitText = $hit.text();

        if (!hitText) {
          ret.error = 'No hit for ' + options.jqueryPattern;
          res.jsonp(ret);
          return;
        }
        text = hitText;
      }

      if (options.parseFloat) {
        try {
          text = text
            .replace(/[^0-9\\,]/g, '')
            .replace(/,/g, '.');
          ret[options.targetKey] = parseFloat(text);
        } catch (e) {
          ret.parseFloatError = true;
        }
      } else {
        ret[options.targetKey] = text;
      }

      let arr = null;
      if (options.splits) {
        for (let i = 0; i < options.splits.length; i++) {
          const split = options.splits[i];
          if (arr === null) {
            arr = text.split(split);
          } else {
            arr = arr.map(o => o.split(split));
          }
        }
        ret[options.targetKey] = arr;
      }

      ret.finishedAt = Date.now();
      ret.durationInSecs = (ret.finishedAt - ret.startedAt) / 1000;

      // console.info('ende>\n', ret);
      res.json(ret);
    });

    httpsRes.on("error", errorHandler);

  }); // https.get

  getReq.on('error', errorHandler);
  getReq.end();

});

module.exports = router;
