/**
 * Every text the conversion writes for the user, in one place:
 *
 * - `errors` stop the conversion: the UDP can't be converted.
 * - `notices` tell the user what to check in the converted code. The last
 *   group is for the caller, which knows the connected backend.
 */

export const errors = {
  noProcessGraph: 'The UDP has no process graph.',
  noResultNode: 'The UDP has no result node.',
  nodeWithoutProcess: (id: string) => `The UDP node "${id}" has no process.`,
  missingNode: (id: string) =>
    `The UDP refers to a node "${id}" that does not exist.`,
  circularNode: (id: string) => `The UDP node "${id}" depends on itself.`
};

export const notices = {
  // Parameters
  geometryParameter: (name: string) =>
    `Parameter "${name}" is a geometry in the UDP. The code uses its bounding box.`,
  parameterWithoutValue: (name: string) =>
    `Parameter "${name}" has no default value. Set it in the code.`,

  // Collections
  filterNotCarriedOver: (property: string) =>
    `The filter on "${property}" is not carried over to the configuration.`,
  optionNotCarriedOver: (option: string) =>
    `The "${option}" option of load_collection is not carried over to the configuration.`,
  collectionInCode:
    'The collection is set in the code. The collection in the configuration is not used.',
  noCollection:
    'The UDP loads no collection. The collection in the configuration is not used.',
  severalCollections:
    'The UDP loads more than one collection, which Studio does not support natively.',
  severalCollectionsInCode:
    'The UDP loads more than one collection, which Studio does not support natively.',

  // Steps and result
  namespacedProcess: (process: string, namespace: string) =>
    `Process "${process}" comes from the namespace "${namespace}".`,
  unusedSteps: (ids: string[]) =>
    `Steps that do not lead to the result of the UDP are left out: ${ids.join(', ')}.`,
  notAnImage: (process: string) =>
    `The result of "${process}" is not an image. The map cannot show it.`,

  // The connected backend
  collectionUnavailable: (id: string) => `Collection "${id}" is not available.`,
  processUnavailable: (process: string) =>
    `Process "${process}" is not available on this backend.`,
  processesNotChecked: 'The processes could not be checked against the backend.'
};
