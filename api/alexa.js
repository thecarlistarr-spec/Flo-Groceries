const { SkillRequestSignatureVerifier, TimestampVerifier } = require('ask-sdk-express-adapter');

const GROCERY_API = 'https://klaskacubfmbtuvcrisr.supabase.co/functions/v1/grocery-api';
const signatureVerifier = new SkillRequestSignatureVerifier();
const timestampVerifier = new TimestampVerifier();

function alexaResponse(text, shouldEndSession = true, repromptText = null) {
  const response = {
    outputSpeech: { type: 'PlainText', text },
    shouldEndSession,
  };
  if (repromptText) {
    response.reprompt = { outputSpeech: { type: 'PlainText', text: repromptText } };
  }
  return { version: '1.0', response };
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function addItem(name, who) {
  const url = new URL(GROCERY_API);
  url.searchParams.set('who', who);
  url.searchParams.set('action', 'add');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    let message = `Grocery API failed with ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'Flo Groceries Alexa endpoint' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const requestUrl = new URL(req.url, 'https://flo-groceries.local');
    const who = process.env.FLO_GROCERY_WHO || requestUrl.searchParams.get('who');
    const expectedSkillId = process.env.ALEXA_SKILL_ID || requestUrl.searchParams.get('skill');
    if (!who || !expectedSkillId) {
      return res.status(500).json({ error: 'Alexa endpoint is missing its list or skill configuration.' });
    }

    const rawBody = await readRawBody(req);
    await signatureVerifier.verify(rawBody, req.headers);
    await timestampVerifier.verify(rawBody);

    const envelope = JSON.parse(rawBody);
    const actualSkillId = envelope?.context?.System?.application?.applicationId || envelope?.session?.application?.applicationId;
    if (actualSkillId !== expectedSkillId) {
      return res.status(403).json({ error: 'Skill ID mismatch.' });
    }

    const request = envelope.request || {};
    if (request.type === 'LaunchRequest') {
      return res.status(200).json(alexaResponse(
        'Flo Groceries is ready. Say add pretzels, or tell me another item.',
        false,
        'What should I add to Flo Groceries?'
      ));
    }

    if (request.type !== 'IntentRequest') {
      return res.status(200).json(alexaResponse('Flo Groceries is ready when you need it.'));
    }

    const intentName = request.intent?.name;
    if (intentName === 'AddGroceryItemIntent') {
      const item = request.intent?.slots?.item?.value?.trim();
      if (!item) {
        return res.status(200).json(alexaResponse(
          'What should I add?',
          false,
          'Tell me the grocery item you want to add.'
        ));
      }
      await addItem(item, who);
      return res.status(200).json(alexaResponse(`Added ${item} to Flo Groceries.`));
    }

    if (intentName === 'AMAZON.HelpIntent') {
      return res.status(200).json(alexaResponse(
        'You can say, add pretzels, or put paper towels on the list.',
        false,
        'What should I add?'
      ));
    }

    if (intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.StopIntent') {
      return res.status(200).json(alexaResponse('Okay.'));
    }

    if (intentName === 'AMAZON.FallbackIntent') {
      return res.status(200).json(alexaResponse(
        'I can add items to Flo Groceries. Try saying, add bacon bits.',
        false,
        'What should I add to Flo Groceries?'
      ));
    }

    return res.status(200).json(alexaResponse(
      'I can add items to Flo Groceries. What should I add?',
      false,
      'What should I add?'
    ));
  } catch (error) {
    console.error('Alexa request failed', error);
    const verificationFailure = /verif|signature|certificate|timestamp/i.test(String(error?.message || error));
    return res.status(verificationFailure ? 400 : 500).json({ error: verificationFailure ? 'Invalid Alexa request.' : 'Unable to update Flo Groceries.' });
  }
};
