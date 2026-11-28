# Lakeside Shift Assistant

A Claude Project and on-shift web app for a fictional hotel, built as a case study for how I would work with an owner-led business: sit beside the people doing the job, capture how the work actually runs, and leave them a tool they can use.

**Matt Harmer** · Lake Macquarie, NSW · [LinkedIn](https://www.linkedin.com/in/matt-harmer-me/) · [GitHub](https://github.com/mattharmer)

This repository is a demonstration pack. **The Lakeside Hotel is not a real venue.** The procedures are written in the style of internal hotel documents so the Project can be demonstrated honestly, not as a claim about a live client.

Live app: [https://mattharmer.github.io/lakeside-shift-assistant/](https://mattharmer.github.io/lakeside-shift-assistant/) (GitHub Pages, `main` branch, site root).

---

## Problem

On a busy shift, venue staff need short, reliable answers: how do we close the bar, what is the house cocktail spec, what do I do if EFTPOS drops out, when must I get the Duty Manager. Those answers already live in procedures, but they are hard to use mid-service, and a general-purpose chatbot will invent steps, prices or legal advice.

The job is the same one a client manager does with any small business: learn how the team works, put the knowledge they already have into a tool, and make sure the tool knows when to stop.

## Approach

1. Write the documents the way a real venue would use them — short, numbered, with named owners and extensions, and no invented licence conditions or codes.
2. Put those documents into a Claude Project with custom instructions: answer only from the uploaded files, cite the document, stay brief, and escalate anything to do with RSA, safety or incidents to the Duty Manager.
3. Test it with questions staff would actually ask, including ones it should refuse to guess.
4. Build a simple on-shift app from the same material so a Duty Manager can walk the opening or closing list, step through a POS or AV fault, start an incident summary, or look up a cocktail spec, without leaving the floor.

A second, lighter pack for a fictional Newcastle trades business sits in [`examples/piper-and-watt/`](examples/piper-and-watt/) to show the same method in another industry Helm-style consultancies often have on their books.

## Claude Project setup

In a new Claude Project (I used the name **Venue Ops Assistant**):

1. Paste the boxed instructions from [`docs/00-Custom-Instructions.md`](docs/00-Custom-Instructions.md). Do not paste the test-questions section.
2. Upload documents 01-16 in `docs/` (Word or Markdown).
3. Ask the test questions below and check that answers cite the document and do not invent steps.

## Custom instructions (summary)

The Project is told to:

- Use only the uploaded venue documents
- Lead with the action, in short numbered steps, in Australian English
- Cite the document it is relying on
- Say so and send the staff member to the Duty Manager (ext. 201) if the documents do not cover the question
- Follow the RSA and incident procedure exactly and get the Duty Manager for refusals, evictions, injuries or anything involving police or security
- Never invent legal advice, staff names, passwords, safe codes or prices
- Call 000 first if someone is in danger, then get the Duty Manager

The full text is in `docs/00-Custom-Instructions.md`.

## Documents

| Doc | File | What it covers |
| --- | --- | --- |
| 00 | [00-Custom-Instructions.md](docs/00-Custom-Instructions.md) | Project instructions and test questions |
| 01 | [Opening and Closing Checklist](docs/01-Opening-and-Closing-Checklist.md) | Duty Manager, bar, gaming and kitchen open/close |
| 02 | [RSA and Incident Procedures](docs/02-RSA-and-Incident-Procedures.md) | Refusals, evictions, minors, incidents |
| 03 | [Cocktail Spec Sheet](docs/03-Cocktail-Spec-Sheet.md) | House specs for ten classic cocktails |
| 04 | [POS, Network and AV Troubleshooting](docs/04-POS-Network-AV-Troubleshooting.md) | EFTPOS, printers, Wi-Fi, screens — and when to stop |
| 05 | [New Starter Induction](docs/05-New-Starter-Induction.md) | First shift, uniform, who to ask |
| 06 | [Customer Complaints and Service Recovery](docs/06-Customer-Complaints-and-Service-Recovery.md) | Complaints, comps, Duty Manager sign-off |
| 07 | [07-Training-Quiz-and-Sign-off.md](docs/07-Training-Quiz-and-Sign-off.md) | Training quiz and sign-off for documents 01–06 |
| 08 | [08-Unanswered-Questions-Log.md](docs/08-Unanswered-Questions-Log.md) | Log of questions the assistant could not answer |
| 09 | [09-Incident-Report-Draft-Template.md](docs/09-Incident-Report-Draft-Template.md) | Incident report draft for Duty Manager review |
| 10 | [10-Google-Review-Reply-Guide.md](docs/10-Google-Review-Reply-Guide.md) | Short, consistent replies to public Google reviews |
| 11 | [11-Shift-Handover-Summary.md](docs/11-Shift-Handover-Summary.md) | One-page handover from one shift to the next |
| 12 | [12-Stock-and-Ordering-Guide.md](docs/12-Stock-and-Ordering-Guide.md) | End-of-night stock count, par levels and order drafts |
| 13 | [13-Weekly-Sales-Summary-Guide.md](docs/13-Weekly-Sales-Summary-Guide.md) | Weekly POS sales summary for the manager |
| 14 | [14-Multilingual-Staff-Answers.md](docs/14-Multilingual-Staff-Answers.md) | How the assistant answers staff in other languages |
| 15 | [15-Screen-Promo-Content-Guide.md](docs/15-Screen-Promo-Content-Guide.md) | Short promo clips for venue TV screens |
| 16 | [16-QR-Codes-and-Quick-Access.md](docs/16-QR-Codes-and-Quick-Access.md) | QR codes and hands-free access to procedures |

Word copies of documents 01–06 are in the same folder.

Documents 07–16 (quiz and sign-off, unanswered-questions log, incident draft template, review replies, handover, stock and ordering, weekly sales summary, other-language answers, screen promos, and QR access) are in `docs/`. The v2 on-shift app already has screens for that material.

## Test questions

These are the questions I use to show the Project working, and to catch invented steps before a demo:

1. The EFTPOS terminal won't connect. What do I check?
2. Someone has been refused service and won't leave. What is the process?
3. Write tonight's close checklist for a new starter on the bar.
4. What is the house spec for an Espresso Martini?
5. A guest says their meal took too long and the steak is overcooked. What do I do, and can I comp it?

If an answer invents a step that is not in the documents, tighten the custom instructions or the relevant document before you show it.

## The on-shift app

[`index.html`](index.html) is a single-file **v2** app (React 18.3.1 and Babel Standalone 7.24.7 from [cdnjs](https://cdnjs.cloudflare.com/), no Google Fonts). It runs in a browser, defaults to dark mode (the toggle is saved in `localStorage`), and keeps checklist and draft state in `localStorage`. There is no API key in the page: live Ask answers go through an optional Cloudflare Worker. The previous single-file app is kept as [`index-v1.html`](index-v1.html).

It includes:

- A mobile-first home dashboard with today's date, a shift chip, checklist progress and open incident drafts
- Dark and light mode
- Bottom navigation (Checklists, Fix It, Incident, Cocktails, Ask, More)
- Nine opening and closing checklists with progress bars, strike-through ticks, and a confirmed reset for the next shift
- Step-by-step POS / network / AV fixes, with a clear stop if a password, ladder or rack access is needed
- An incident-report draft, with a "Draft – Duty Manager to sign" print watermark
- House cocktail specs (the full ten from Document 03, wording as on the spec sheet)
- An **Ask the assistant** screen (`#ask`) that can call a Cloudflare Worker for live, document-only answers
- A training quiz (under More)
- A gap log for questions the assistant could not answer
- Shift handover drafts
- A stock count
- Screen promo scripts
- Quick Access hash links, such as `#closing-bar` and `#eftpos`, listed so they can be printed as QR codes
- A Help screen with a language note

**Known limits** (kept to stay inside a lean build):

- Quiz answers show the correct option but not the document section citation
- There is no RSA refusal-wording or ID-check screen; the app points staff to Document 02 and the Duty Manager (ext. 201)
- Incident and handover print views use the browser print dialog; the watermark is contained so the page does not clip. Page breaks are still basic
- Checklist and Fix It wording is a shortened form of Documents 01 and 04, not word for word

**To try it locally:** from this folder, run `python3 -m http.server 8080` and open http://localhost:8080/. It needs a network connection for the CDN scripts. Opening the file directly (`file://`) can fail in some browsers.

**GitHub Pages:** already enabled on this repository (site root). The empty `.nojekyll` file is there so Pages serves the site as-is. The live app updates when `index.html` is merged to `main`.

## Ask the assistant (live AI)

The on-shift app can ask a live model. The browser never holds an API key.

```
GitHub Pages (index.html)
        POST { question, history? }
                ↓
  Cloudflare Worker  (worker/)  POST /ask
                ↓
  Anthropic Messages API (Claude, key stored as a Worker secret)
                ↓
        { answer, sources[] }
```

`ASK_URL` at the top of `index.html` is the Worker URL. Leave it empty until the Worker is deployed: the Ask screen then shows **The live assistant is offline. Try the Claude Project demo** and the rest of the app still works. The Worker only answers from the bundled Lakeside documents, cites the document, sends uncovered questions to the Duty Manager (ext. 201), and says to call 000 first if someone is in danger.

Worker details, limits, and local tests are in [`worker/README.md`](worker/README.md).

### Deploy the Worker (no code required after this)

Do not skip the spend limit. This is a demo, not a free chatbot.

1. Create a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and an [Anthropic](https://console.anthropic.com/) API key.
2. In the Anthropic console, set a **monthly spend limit** so a busy demo cannot run away with cost.
3. On your computer:
   ```bash
   npm i -g wrangler
   wrangler login
   cd worker
   npm install
   npm run build
   ```
4. Create the KV namespace used for the 50/day per-IP cap and the global daily cap, then paste the printed id into `worker/wrangler.toml` (`ASK_LIMITS`):
   ```bash
   npx wrangler kv namespace create ASK_LIMITS
   ```
5. Store the key on Cloudflare (you will be prompted; it never goes in the repo):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
6. Deploy:
   ```bash
   npx wrangler deploy
   ```
7. Copy the `*.workers.dev` URL Wrangler prints and paste it into `ASK_URL` at the top of `index.html` (no trailing slash). Commit that change when you want the live GitHub Pages app to call the Worker.

The Worker allows browser calls only from `https://mattharmer.github.io` and `http://localhost:8080`.

### Cost

Each question sends the venue documents to Anthropic. Repeat questions are cheaper once Anthropic’s **prompt cache** has the docs block, but you should still assume there is a cost. Check [Anthropic’s current pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) for the model in `worker/wrangler.toml` (`ANTHROPIC_MODEL`, default Claude Haiku). Cloudflare Workers has its own free tier and paid limits — check Cloudflare’s current Workers pricing if the demo is used a lot.

Do not hardcode an API key in `index.html` or in this repository.

## Results

What this pack is meant to show, not a claim about a live hotel rollout:

- A business's existing procedures can be turned into a tool staff can use mid-shift
- Guardrails matter: the assistant cites its source and escalates compliance and safety
- The same documents can drive both a Claude Project and a simple app
- The method is not limited to hospitality — see the trades example

I have also used Cocktail Harvest content, with the Toronto Hotel logo only, as short cocktail videos on the venue screens at work to help lift cocktail sales. That is a separate, live-venue example of applied content; sales results should be added only if I confirm them.

## What this shows for a client-manager role

This is the working pattern I would bring to a consultancy that sits beside a team, builds around how they already work, and leaves a clear record of what is in place:

- Learn the job first, then build
- Write things down so the next person can follow them
- Test with the questions the team will actually ask
- Help people use what has been set up, including when the answer is "get the supervisor"
- Follow through: the documents, the Project instructions, the test list and the app are all in this repository

## Licence and use

Fictional training materials, written by Matt Harmer for demonstration. Not for use as real RSA, WHS or legal advice. Please do not present The Lakeside Hotel as a live client.
