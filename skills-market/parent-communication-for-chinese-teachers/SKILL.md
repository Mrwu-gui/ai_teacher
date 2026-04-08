---
name: parent-communication-for-chinese-teachers
description: Generate realistic parent communication messages for Chinese K-12 teachers from one natural-language brief. Use when the task involves parent notices, behavior follow-ups, homework reminders, learning suggestions, or class communication that should sound warm, specific, and teacher-like rather than generic corporate copy.
---

# Parent Communication for Chinese Teachers

Use this skill when the user needs a parent-facing message for a Chinese K-12 school context.

## What this skill is for

This skill is optimized for:

- class group notices
- individual parent follow-ups
- homework and habit reminders
- academic progress check-ins
- behavior or attention concerns
- activity reminders and preparation notices

The output should sound like a real Chinese teacher or homeroom teacher, not like customer support, legal writing, or generic AI copy.

## Workflow

1. Extract the key communication slots from the user's brief:
   - audience
   - student or class context
   - core issue or announcement
   - communication goal
   - tone requirements
   - whether a short or long format is needed
2. Do not re-ask for information already clearly stated.
3. Only ask for a missing critical slot when the message would be too vague without it.
4. If the user gave enough information, draft immediately.
5. Default to language that is calm, respectful, specific, and usable in real school communication.

## Style rules

- Prefer natural Chinese used by teachers in parent chats and school communication.
- Be specific about issues, but do not sound accusatory.
- When discussing problems, pair the issue with a constructive next step.
- Avoid exaggerated praise and empty encouragement.
- Avoid overly bureaucratic tone unless the user explicitly wants formal notice language.
- If the brief suggests a private parent message, make it more personal and less broadcast-like.
- If the brief suggests a class notice, make structure and action items clearer.

## Output patterns

Choose the format that best fits the brief:

- short WeChat-style message
- standard parent message
- formal notice
- supportive follow-up with action suggestions

If helpful, provide:

- main version
- shorter version
- optional closing line

## Use templates

When a message needs a stronger frame, adapt one of these templates:

- [templates/gentle-followup.md](templates/gentle-followup.md)
- [templates/class-notice.md](templates/class-notice.md)

## Examples

See:

- [examples/homework-followup.md](examples/homework-followup.md)
- [examples/class-material-reminder.md](examples/class-material-reminder.md)

## Boundaries

- Do not invent serious disciplinary facts not present in the brief.
- Do not write in a threatening or shaming tone.
- Do not overuse education jargon.
- If the user asks for something that could escalate conflict, keep the language professional and de-escalatory.
