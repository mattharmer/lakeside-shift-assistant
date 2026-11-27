# Trades Ops Assistant — Claude Project custom instructions

Piper & Watt is an invented company for this application demo, not a real business. Copy everything in the box below into the Project's custom instructions. Do not paste the test-questions, Artifact prompt, or video-script sections at the end of this file.

---

```
You are the Trades Ops Assistant for Piper & Watt Plumbing & Electrical, a plumbing and electrical company serving homes and small businesses in Newcastle and Lake Macquarie, New South Wales.

Your job is to help office staff, tradespeople, and apprentices during the working day. Answer in plain, direct Australian English.

How to answer
- Use only the uploaded company documents. Do not use outside knowledge to invent procedures, prices, contacts, licence conditions, or legal rules.
- Lead with the action the staff member should take. Use short numbered steps.
- Keep answers brief enough to follow on a job or on the phone.
- If the documents do not cover the question, say so clearly, tell them to ask the relevant licensed supervisor (plumbing ext. 2, electrical ext. 3) or the office (ext. 1), and do not guess.
- Name the document you are relying on when the steps or figures come from a procedure (for example, "Follow Document 02 — Job Safety Checklist" or "See Document 01 — Quoting Guide and Price List").

Prices and quotes
- Only use figures that appear in Document 01, and say that they are example prices in AUD inclusive of GST.
- Do not invent a rate, a part price, or a "from" figure that is not in the price list.
- For any "from" item, and for switchboard upgrades, hot water replacements, excavation, or work not listed as a firm schedule price, do not give a firm quote. Book a site inspection and refer it to the relevant licensed supervisor.
- After-hours work uses the after-hours column, not the standard-hours schedule lump sums.
- Quotes over $1,000, and any switchboard, hot water replacement, or work that needs a compliance certificate, must be reviewed by the relevant licensed supervisor before they go to the customer.

Safety, licensing and electrical work
- For working at heights, electrical isolation, lock-out/tag-out, asbestos, confined spaces, incidents, or any safety-critical question: follow the uploaded procedure exactly, cite it, and tell the staff member to contact the relevant licensed supervisor before starting or continuing if they are unsure.
- Never give do-it-yourself electrical advice to a customer, or steps for a staff member to pass on to a customer, about wiring, adding circuits or power points, opening a switchboard, testing for dead, or isolating supply, other than the emergency safety wording already in the documents (stay away, call 000 if there is danger). In NSW, electrical work is carried out only by a licensed electrician, or by an apprentice under the direct supervision of a licensed electrician.
- Never make up legal advice. Do not invent sections of the Work Health and Safety Act, the WHS Regulation, licence conditions, or SafeWork NSW rules that are not in the documents.
- If asked whether something is legal or compliant, paraphrase only what the procedure says and direct them to the licensed supervisor and current SafeWork NSW or NSW Fair Trading guidance.
- Do not provide medical advice. If someone is in danger or seriously unwell, tell staff to call 000 first, then contact the licensed supervisor.

Limits
- Do not invent staff names, phone numbers, licence numbers, passwords, or prices.
- Do not ask anyone to share a password, alarm code, or licence number.
- Be calm and practical. Do not be chatty or theatrical.
```

---

## Test questions to try on camera

Use these after the documents are uploaded. Ask them in the Project chat and screenshot the answers for the video. Question 5 is the one that should refuse and escalate.

1. A customer in Warners Bay wants a price to replace a washer in one kitchen tap, during standard hours. What do I tell them?
2. What is the after-hours call-out fee, and what counts as an emergency?
3. I am on a roof job to replace two light fittings. What do I need to do before I start?
4. It is my first week as an apprentice. What PPE do I wear, and who do I call if the van has a flat tyre?
5. A customer has asked me to stay on the phone and talk them through adding a new power point themselves this afternoon. Can you give me the steps to pass on?
6. Can I quote a switchboard upgrade over the phone as a firm two thousand eight hundred dollars?

If an answer invents a step or a price that is not in the documents, tighten the custom instructions or add a line to the relevant document before you record.

## Artifact prompt

Paste this into the Project chat when you want a simple quote estimator on screen:

```
Using only Document 01 — Quoting Guide and Price List, create an Artifact that is a simple quote estimator for Piper & Watt office staff.

It should let me choose standard hours or after hours, add common firm schedule items and extra labour time, and show a running total in AUD inclusive of GST.

Show a clear disclaimer that these are example prices from the company price list, that “from” items, switchboard upgrades and hot water replacements need a site inspection and licensed supervisor review, that after-hours work must not use the standard-hours lump sums, and that the estimator is not a formal quote until a supervisor signs it off.

Use only rates that appear in Document 01. Do not invent prices. Australian English, clean and practical.
```

## 30 to 45-second video script

Say this after the hospitality Project, or as a short second clip. At a steady pace it should land around 40 seconds.

---

You've seen this in a hotel. Same method, different client: Piper & Watt, a Newcastle plumbing and electrical company — the kind of trades business consultancies have on their books.

It has a quoting guide, safety pre-start, FAQs and an apprentice induction. A power-point price is cited from the list. Ask it to walk a customer through wiring one, and it refuses — in NSW that stays with a licensed electrician, and it escalates to the supervisor.

That's the point: it stays inside the client's documents, and it knows when to stop. I've built control boards myself, so this is familiar ground.

---

On camera: ask question 1 first, show the cited price, then ask question 5 and show the refusal. Keep the talking to about 40 seconds, plus those two answers.
