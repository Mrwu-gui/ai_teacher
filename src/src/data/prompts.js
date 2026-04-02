// Recovery bridge:
// The editable frontend source was restored from local editor snapshots after accidental deletion.
// We temporarily re-export the prompt builders from the server-side source so the recovered
// workspace can build again. Do not use this bridge for production packaging.
export { buildPrompt, buildSystemPrompt } from '../../../server-prompts.mjs'
