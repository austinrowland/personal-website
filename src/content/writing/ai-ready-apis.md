---
title: "AI-Ready APIs: Agents Are the New Audience"
description: How agents choose APIs differently than developers, and what it takes for an API to be ready for them.
date: 2026-07-28
tags: [agents, apis]
cover: ../../assets/writing/ai-ready-apis.jpg
coverAlt: "Woodblock print of an orange torii gate on a small island at sunrise, with paper boats carrying small orange lights drifting toward it across calm water."
original:
  publication: Postman Blog
  url: https://blog.postman.com/ai-ready-apis-agents-are-the-new-audience/
  publisher: Postman
  publisherUrl: https://www.postman.com/
---

For the past six months my team has worked inside some of the largest API programs anywhere, the companies that both produce and consume the most APIs in the world. We got a close look at how they’re building for agents, and one thing became obvious fast. The audience for an API used to be engineers. Now the biggest consumer is a coding agent, and most programs haven’t caught up to that.

These teams spent years making their APIs easy for people to adopt, with real documentation, SDKs, developer portals, and specs. A new kind of consumer is now showing up at that same front door and reading everything differently. A coding agent doesn’t read docs the way a person does. It won’t email support when it gets stuck, it gives you no benefit of the doubt, and it only reads what’s machine-readable. When it can’t get your API working, it drops you and tries one it can.

So we built AI-Ready APIs, an assessment that measures how ready an API is for the agents that will consume it. It came out of what we saw in the field, what we learned inside Postman, and research on how agents actually read an API. You can point it at [your own API](https://www.postman.com/ai/ai-ready-apis) and follow along as you read.

![The AI-Ready APIs page on postman.com: "Are Your APIs Ready for AI Agents?", a company-domain search box, and a leaderboard of API scores by category.](/writing/ai-ready-apis/report.jpg)

## How developers used to choose an API, and how agents choose now

Think about how a developer used to bring an API into a product. They heard about it from a colleague, a talk, a search result, or a reputation built over years. They weighed it with judgment: past experience with the vendor, how good the support had been, a general sense of trust. Then they signed up, worked through onboarding, set up auth, and pushed on the integration until it ran cleanly in production. When a doc was wrong or an edge case wasn’t covered, they did what people do. They opened a ticket, asked a colleague, guessed at the undocumented field, or worked through examples until it made sense. A developer is a resilient reader. They work around the gaps you leave.

That same decision looks very different now. A developer describes the goal to a coding agent and the agent does the work. It researches which APIs fit, reads the specs and docs, forms a view, recommends one, and wires up the integration, often without the developer ever landing on your website. The discovery, evaluation, and integration a person used to do by hand now happen inside the agent.

If you own an API program, the consequence is direct. A developer who gets stuck files a ticket or emails someone. An agent that gets stuck picks a competitor, and you never find out. There’s no ticket and no abandoned signup to win back. It hit something it couldn’t get past (auth it couldn’t infer from the docs, an error it couldn’t parse, an endpoint whose behavior it couldn’t confirm) and moved on to the next option that worked. You lose inside a decision you were never part of, and it never shows up in a meeting.

And every gap a human used to absorb becomes a hard stop for a machine: a missing description, an ambiguous parameter, an undocumented edge case, a surprise rate limit, a 500 that returns an HTML error page instead of JSON. It stops at the same wall every time, for every developer whose agent hits it.

The best teams we work with don’t treat this as a threat. They think it’s the most interesting change to API programs in a decade, and they’re reorganizing around it instead of bracing against it. Agent traffic through their APIs is climbing fast, and those agents are making integration choices that turn into revenue. The programs that lean into that early are the ones that will set the norms everyone else follows.

## What we kept seeing in the field

We built a real assessment because of a pattern we couldn’t stop running into.

The programs we sat inside had strong developer experience. Not a spec file and good intentions, but mature docs, SDKs in several languages, quickstarts that actually worked. And a lot of them were still hard for an agent to use. The APIs were fine. Agents and people just need different things, and nobody had been building for the difference.

A developer can open a rendered docs page, read a few paragraphs, guess what an error means, and keep moving. An agent needs the same information in a form it can actually consume: a machine-readable entry point that tells it where to look, docs it can pull as clean text instead of a JavaScript-rendered page, an error it can read as a code and a reason instead of a wall of HTML. A beautiful portal does nothing for an agent if the one thing it needed was never published where the agent looks, or in a format it can parse.

That gap is what the assessment measures. Good developer experience is the ground floor. On top of it sits a second layer that exists only for agents, and most teams haven’t built it yet, including very good ones. That’s the opening. The work is real and doable, and most of your competitors are still sitting in the same gap you are.

## The two tiers of agent-readiness

Once the pattern was clear, we split it into two tiers. The score is organized around them, and so is the way we think a team should approach the work.

The first tier is API Product Foundations, the API design and developer experience most programs have already invested in: a well-designed, versioned contract, complete typed schemas, docs, quickstarts, code samples, and SDKs. None of it is agent-specific, and that’s the point. It serves both audiences. It’s what lets a developer onboard fast, and it’s the ground every agent interaction stands on. If you’ve done this work, you’re not starting over. Most of it carries straight forward, and it stays in the score because everything an agent does depends on it.

The second tier is Agent Journey Optimizations, the parts that exist only for agents. This is where the new work lives. An agent moves through many of the same stages a developer does (find the API, understand what it does, operate it), but the things it needs at each stage are invisible to a person. A machine-readable front door in llms.txt. Markdown versions of the docs it can fetch cheaply. RFC 9457 problem-detail errors it can parse instead of guess at. Discoverable auth metadata, schemas complete enough to drive a function call, an AGENTS.md that spells out how to work with the API. A human never sees any of it. It’s the whole difference between an agent using your product on its own and giving up.

So there are two layers. Developer experience underneath, agent experience on top. The assessment grades both, grouped this way, so you can see where you’re already strong and where the new work sits.

## The assessment we built

AI-Ready APIs turns all of this into a score you can act on.

Point it at a domain. It finds the public API surfaces an agent would find, the same way an agent would starting from nothing: the spec, the docs, the SDKs, a CLI, an MCP server, the well-known files. Then it runs a set of concrete checks across them and hands back a graded report, with an overall grade, a breakdown across five categories, and the exact places an agent is going to get stuck.

It’s a new standard, but it builds on the developer experience you already have. An AI-ready API is one an agent can discover, interpret, and operate on its own, with no human in the loop. A developer fills in whatever you leave out. An agent only has what’s machine-readable, so the whole thing comes down to one question. How much of your API can an agent use without help? Every other design choice follows from that.

![A sample AI-Ready APIs report for Pinecone: an overall score of 89, a radar chart across five categories, and pass, warn and fail counts for each.](/writing/ai-ready-apis/scores.jpg)

## How the score works

The assessment uses only public sources. No inside access, no telemetry, nothing to install or grant. That’s deliberate. It puts the assessment where an agent actually stands, outside your domain, seeing only what’s publicly reachable. It probes the paths an agent would check, follows what it finds, and confirms each surface is real, reachable, and genuinely published by you before it counts for anything. If an agent can’t see it, neither can we.

The design choice that matters most is simple. The score rewards the best evidence across all your surfaces, not any single one. An early version docked any API that didn’t have a pristine OpenAPI spec. That was the wrong instinct. Plenty of strong programs prove what they can do somewhere other than a spec. Anthropic is the example I keep coming back to: excellent docs, a mature SDK, a real CLI, and no public spec. A spec-first grader would call that a weak API, which is obviously wrong. So the model doesn’t favor any single surface. A capability counts if any surface shows it, and we take the strongest evidence an agent could find, not the weakest. A team that’s strong on SDKs doesn’t get punished for skipping a spec, because an agent wouldn’t punish them either.

The rubric itself is static. We built it from Postman’s internal research and the field work our forward deployed team has done. Once the tool has pulled all your public surfaces, it runs a set of deterministic checks against them.

Altogether that’s 25 checks across five categories and seven surfaces, rolled into one grade on a ladder that runs from Agent-Optimized at the top, down through AI-Ready, Advancing, Building, and Emerging, to Not AI-Ready at the bottom. It’s a gradient, not a pass/fail line, so even a bare-bones API gets a real score and something to climb toward.

Two limits are worth stating up front. The score covers the surface area agents touch, not the overall quality of your product. It measures whether a capability is present, discoverable, and consistent across surfaces, not whether every operation behaves perfectly under every input. A genuinely strong product can still score low because it’s hard for an agent to read, and that low score is your map to fixing it. And being listed in Postman’s own catalog earns no credit. That’s a flag for whether your company is already in our API network as a discovery and GTM channel.

## The five things an agent needs from you

The five categories follow the order an agent moves through a product: the foundation it stands on, then discovery, understanding, and operation.

**API Design** is about whether the contract is well built. An agent can’t call a function it has no schema for, and it can’t survive a breaking change to an API that never declared a version. This category grades whether the contract is machine-readable and versioned, how complete and typed the schemas are, and whether auth is declared in a way an agent can find. Complete, typed schemas are what make agent function-calling possible at all.

**Developer Experience** is about how fast a newcomer can onboard. People still choose and maintain these integrations, so the portal, the quickstart, and the code samples all matter, and they double as the agent’s route to its first successful call. The bar good teams hold is a useful one. Someone with no prior knowledge should be able to find the API, try it, and be making real calls within minutes. An agent holds you to the same clock, minus the patience.

**Agent Discovery** is whether an agent can find the API at all. This is where the agent-specific work starts. Before anything else happens the agent has to locate the API, and it doesn’t browse your marketing site. It crawls machine-readable entry points. This category grades llms.txt as the front door, whether you show up in the MCP and package registries agent tooling checks, and whether the docs are reachable instead of stuck behind a login. Think of it as the new SEO. The ranking signal isn’t your spot on a results page anymore, it’s whether an agent can integrate without getting stuck.

**Agent Understanding** is whether an agent can correctly interpret what it finds. Finding an API and understanding it are two different things. This category grades what decides whether an agent reasons about your API correctly or hallucinates against it: RFC 9457 errors it can parse without burning a retry, operation descriptions clear enough to pick the right endpoint, docs it can fetch as efficient text, and consistency across surfaces. When the spec, the docs, and the SDK each describe the same thing a little differently, a person shrugs and moves on. An agent choosing between endpoints is left guessing.

**Agent Usability** is whether an agent can operate the API safely, and it carries the most weight, because it’s where integrations actually break. Documented idempotency lets an agent retry a write without double-charging someone. Rate-limit headers let it back off instead of hammering you until it’s blocked. Consistent pagination lets it walk a collection without losing its place. A sandbox lets it try a destructive call with no consequences. Everything upstream gets the agent to the point of making real calls. This category decides whether those calls succeed.

## How Postman helps you close the gap

Seeing the gap is only half the job. The other half is closing it, and that’s more straightforward than it looks, because agent-readiness breaks down surface by surface and so do the fixes.

It starts with the spec. Every surface an agent reads (the docs, the SDKs, the CLI, the MCP tools) is only as good as the definition behind it, and the problem we see almost everywhere is a dozen slightly different sources of truth all drifting away from the live API. Postman’s governance tooling pulls them back together. It lints and standardizes the spec as it’s written, enforces the same rules in CI, and keeps a live catalog of every API you have. Fix the spec and consistency, complete schemas, and clean errors all improve across every surface at once, including the specs AI is increasingly writing, which governance keeps honest.

From a clean API spec, [Fern](https://buildwithfern.com/) from Postman, generates surface areas for agents to integrate with your platform. It generates Docs that serve llms.txt by default so agents discover your product over your competitors. Its SDKs cover nine languages, handle retries/pagination/auth and are written to be idiomatic so agents can integrate with your platform. And finally, it’s CLI adds a JSON output mode built for agents so your customers can build workflows that leverage your business logic. Fern is the platform to enable additional agentic surfaces for your APIs all with one spec.

Postman itself becomes the place agents and teams build from. Public workspaces and the API Network are discovery surfaces an agent can reach. Mock servers and sandboxes give it a safe, production-like place to try things. And the workspace acts as a context layer for coding agents directly: Claude Code, Cursor, and Codex pull specs, examples, tests, and auth patterns straight from it, so the same context that makes a developer productive makes their agent productive. Most of the work that makes an API great for agents is the same work that makes it great for the developers driving them, so you’re extending the product you already have rather than building a new one.

## Where this goes next

None of this needs a new standard. The ones agents need already exist: OpenAPI for contracts, MCP for tools, OAuth for auth, RFC 9457 for errors, and llms.txt as the emerging front door. What’s left is adoption. Take what’s already here and use it consistently across every surface an agent can reach. That’s a much more tractable problem than it sounds, and you can start this week.

For years your API’s reader was a person who would fill in whatever you left out. Now it’s an agent that won’t, and it’s already making integration calls for your customers whether you’re ready or not. The teams pulling ahead are the ones treating this as part of the product they already own instead of a side project labeled “AI.” Agents are going to keep picking APIs. I’d rather we be one they pick.

[Scan your ecosystem](https://www.postman.com/ai/ai-ready-apis). It takes a few minutes and gives you a concrete map of where an agent gets stuck, and a clear sense of what to fix first.
