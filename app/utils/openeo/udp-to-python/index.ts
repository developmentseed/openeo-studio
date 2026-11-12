/**
 * Writes the studio Python code of an openEO UDP.
 *
 * - `messages.ts`: every error and notice the user reads.
 * - `udp.ts`: the UDP document and its process graph.
 * - `python.ts`: Python as text.
 * - `client.ts`: what the openEO Python client can express.
 * - `conversion.ts`: writes a process graph as client code.
 * - `studio.ts`: what the studio loader script provides and takes over.
 */
export { notices } from './messages';
export { udpCollectionIds } from './udp';
export {
  udpToPython,
  type UdpConversion,
  type UdpConversionOptions
} from './studio';
