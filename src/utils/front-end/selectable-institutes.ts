/**
 * The institutes a picker may offer: the active ones.
 *
 * A deactivated institute should not be attachable to anything new (issue #11). The institute
 * switcher in the navbar has always filtered this way; the pickers on product and partner forms
 * did not, so a deactivated institute stayed selectable everywhere except the one place it was
 * hidden.
 *
 * This filters what is *offered*, which is deliberately not the same as what is *kept*. A record
 * already attached to an institute that has since been deactivated keeps that attachment: the edit
 * forms exclude those ids from the form's value and merge them back in on submit, so editing a
 * product never silently detaches it from a deactivated institute. Filtering the options is safe
 * precisely because those ids are never in the selection to begin with.
 */
export default function selectableInstitutes<T extends { is_active: boolean }>(
  institutes: T[]
): T[] {
  return institutes.filter((institute) => institute.is_active);
}
