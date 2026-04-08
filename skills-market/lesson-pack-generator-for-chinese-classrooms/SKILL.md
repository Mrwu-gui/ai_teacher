---
name: lesson-pack-generator-for-chinese-classrooms
description: Generate classroom-ready lesson assets for Chinese K-12 contexts from one natural-language teaching brief. Use when the task involves turning a lesson topic into a compact lesson pack such as a lesson outline, intro idea, practice tasks, homework, or related classroom materials.
---

# Lesson Pack Generator for Chinese Classrooms

Use this skill when the user wants to generate multiple lesson-ready assets from a single teaching brief.

## What this skill is for

This skill is optimized for:

- one-lesson prep packs
- lesson outline generation
- classroom intro ideas
- in-class practice tasks
- layered homework
- connected teaching materials around one topic

## Core method

This skill uses a compact workflow:

1. Start from one teacher seed brief.
2. Extract hard constraints:
   - grade / subject
   - textbook version if present
   - topic or unit
   - lesson goal if clearly stated
3. Extract soft preferences:
   - teaching style
   - difficulty
   - practice emphasis
   - output expectations
4. Avoid re-asking what the teacher already stated.
5. Generate the lesson assets in a consistent classroom-ready order.

## Recommended output order

When the user asks for a lesson pack, prefer this order:

1. lesson objective summary
2. lesson intro idea
3. core teaching flow
4. in-class practice
5. homework or extension task

If the user only wants one part, generate only that part.

## Style rules

- Use language suitable for Chinese K-12 teachers.
- Keep outputs practical, not theoretical.
- Prefer classroom-usable structures over long explanation.
- Keep transitions between sections coherent.
- If the user asks for a vivid or engaging lesson, reflect that in the intro and activities, not by adding empty adjectives.

## Use templates

Adapt these templates as needed:

- [templates/lesson-pack-order.md](templates/lesson-pack-order.md)
- [templates/lesson-brief-template.md](templates/lesson-brief-template.md)

## Examples

See:

- [examples/chinese-reading-pack.md](examples/chinese-reading-pack.md)
- [examples/math-pack.md](examples/math-pack.md)

## Boundaries

- Do not produce all sections if the brief clearly asks for only one asset.
- Do not force textbook version if the user did not mention it and it is not needed.
- Do not repeat the same teaching objective in every section.
