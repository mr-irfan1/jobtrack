import type { ApplicationDraft, JobApplication } from '../../types/application'

/**
 * Assemble a persistable JobApplication from a draft by minting its id.
 *
 * Id assignment is a data concern, so it lives here rather than in the View.
 * This module imports only types (erased at runtime), which keeps it loadable
 * under `node --test` — unlike ApplicationsModel, whose runtime import of the
 * storage service can't be resolved by Node's ESM loader without an extension.
 */
export function buildApplication(draft: ApplicationDraft): JobApplication {
  return { ...draft, id: crypto.randomUUID() }
}
