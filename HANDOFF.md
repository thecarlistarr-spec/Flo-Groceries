# Flo Groceries Alexa Handoff

## DONE
- Shared Flo Groceries app is live and backed by Supabase.
- Snack price rules added to Flo Groceries UI.
- Alexa custom skill interaction model saved at `alexa/interaction-model.json`.
- Secure Supabase Edge Function `flo-groceries-alexa` deployed and ACTIVE.
- Alexa requests are verified using Amazon request signature + timestamp validation.
- Requests are restricted to the skill ID embedded in the endpoint path.
- Skill ID: `amzn1.ask.skill.ee139231-3937-45b8-876e-e40c565c5510`.
- Exact HTTPS endpoint: `https://klaskacubfmbtuvcrisr.supabase.co/functions/v1/flo-groceries-alexa/amzn1.ask.skill.ee139231-3937-45b8-876e-e40c565c5510`.
- Successful adds write directly to `grocery_items` for the Flo household and record `added_by = Alexa`.

## REMAINING
- In Alexa Developer Console, open existing `Groceries` custom skill.
- Build > Custom > Endpoint > HTTPS: paste the exact endpoint above.
- Select the certificate option indicating the endpoint has a certificate from a trusted certificate authority.
- Build > JSON Editor: replace model with `alexa/interaction-model.json`.
- Save Model and Build Model.
- Test in Development using: `Alexa, tell Flo Groceries to add pretzels.`
- Confirm pretzels appear in Flo Groceries with `added by Alexa`.

## BLOCKER
- Amazon Developer Console is account-authenticated and there is no connected Alexa Developer Console tool available here, so the final console clicks must be completed in the Amazon UI.

## NEXT ACTION
Paste endpoint, paste interaction model, build, then run one development test and verify the item lands in Flo Groceries.
