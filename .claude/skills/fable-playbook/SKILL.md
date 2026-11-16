---
name: fable-playbook
description: Working method for tasks in this repository - how to plan a task, split it into steps, and check the result before reporting. Load it at the start of any task that takes more than one step (a feature, a bug fix, a design change, a question that needs research), and read its "Check your own work" section again before you say the work is done.
---

<!-- Psáno anglicky, protože to čte AI. Pravidla projektu jsou v CLAUDE.md, tady je jen pracovní postup. -->

# Playbook: plan, split, check

`CLAUDE.md` holds the rules of this project and wins wherever the two differ. This file is the method: the order to think in, and the mistakes that have already cost sessions here. Each point says why, and most name what actually happened.

The situation that shapes everything: the author cannot review code, works from a tablet, and pays for every round trip out of a shared usage limit. So a task is not finished when the code is right. It is finished when the result is where the next session and the author will find it, and the author can confirm it in a few taps.

## Plan

1. **Read before you decide.** `CLAUDE.md` is already loaded. From `README.md` read only the section the task touches. Then look at recent history, because other sessions push to `main` between your turns. Once, between two messages of a single conversation, `main` gained sixteen commits and the app was renamed. A plan built on what you remember of the repo is built on an old repo.

2. **Decide what kind of answer is wanted.** A question gets an answer, a build request gets a build. Do not change the repository when the author asked how something works, and do not hand back an explanation when they asked for a change. The scope is the request, not what you would also improve.

3. **Read the request's own words twice.** The first read tells you the topic, the second tells you the scope. A request once said "applications", plural. The first result was tied to the one existing app, and the author had to ask whether it was general. That question was a wasted round trip, and one more look at the original sentence would have prevented it.

4. **Write down "done" before you start.** Three things: what will exist at the end, where it has to land, and how the author checks it on the tablet. If you cannot say how they would check it, the plan is not finished.

5. **Find the assumption the whole plan stands on and test it first.** Ask: if one thing I believe is false, which one wastes the most work? A plan of several follow-up sessions once rested on each session seeing the previous one's output. A new session starts from `main`, so anything left on a session branch is invisible to it. That had to be settled before a single step was written.

6. **Facts come from sources, not from memory.** For how a tool or the platform behaves, read its documentation or try it in the environment, because both change faster than you were trained. For what the code does, open the file. Keep three labels in your head and carry them into the report: verified, inferred, untested. The history once showed six commits to one logo in twenty-two minutes. That is evidence about commits. How many messages the author wrote is a guess, and it was reported as one.

7. **Ask only what you cannot decide and what changes the work.** Everything else gets the sensible default, stated in one clause. When you do ask, follow the form in `CLAUDE.md`.

## Split into steps

- **Every step ends in something you can check on its own:** a passing test, a rendered picture, the output of a command. A step you cannot check is either two steps or not yet understood.
- **Order by dependency.** Put first whatever makes the later steps shorter or safer: the check before the thing it checks, the rule before the work it governs.
- **Cheap proof before expensive build.** If one part is risky, probe that part alone with the smallest thing that can fail, then build around what you learned.
- **Batch what is independent.** Lookups that do not depend on each other go out together. Go one at a time only when the next call needs the previous result.
- **Size the work to the limit.** If the task will not fit comfortably in one session, say so at the start and propose where to cut it. Running out halfway leaves the author with nothing they can use.
- **Deliver as soon as the result is durable, then polish.** A finished page was once published, the review went on, and the usage limit ran out before the author got the link. They waited a day for something that already existed. Commit, push, send the result, and only then refine.
- **Live and irreversible things go last, behind a check.** When you test a safeguard, make the test harmless if the safeguard fails. A trial of a hook that blocks bad pushes was first written to push a deliberately broken script to `main`. It was changed to a comment-only edit, so that a hook which did not fire could not break the live site.
- **Do not build the general version before the second use.** Until a thing has been needed twice you do not know which parts are general.

## Check your own work

- **Run it.** Run `npm test`, and for anything visible render it at the widths `CLAUDE.md` names and look at the picture. Output you have read is a check. A belief that it should work is not.
- **Check against the request, not against your plan.** Before you report, open the author's original message and tick off each thing it asked for. Your plan can be completed perfectly and still miss the request.
- **Look for what a green test cannot show.** Did it land on `main`? Will the next session see it? Does anything depend on the author's device or data that the cloud cannot reproduce? Name those as unverified. Silence reads as "it passed".
- **Check every fact you quote against its source:** counts, dates, file names, commands. A wrong number costs a round trip and some trust.
- **One proper look, one pass of fixes.** Verify thoroughly once. Do not loop on re-checking what already passed, because that spends the limit without changing the result.
- **After two failed fixes of the same thing, stop patching.** Read the evidence again from the start and question the assumption underneath. A third variation of the same fix mostly adds noise.
- **Before you say done:** the working tree is clean, the work is pushed, `main` was fetched right before the push, and nothing was forced. Other sessions push too.
- **Say where the result falls short.** Asked whether a result was general, the true answer was "only half". Saying so and then fixing it cost one message. Defending it would have cost several.

## Report

Use the format `CLAUDE.md` asks for. Put the result first: what exists now and where. Then what changed, what to check on the tablet, and what you could not verify. Leave out the options you did not pursue, and do not end on a question unless the work cannot continue without the answer.
