# Assistant prompts

Prompts for trying the Assistant tab against the MPC backend
(`https://openeo.mpc.ds.io`). Start a **New chat** between groups, so one
conversation does not steer the next.

The agent and its toolset are in
[openeo-studio-assistant](https://github.com/developmentseed/openeo-studio-assistant),
whose README says how to run them locally. Two catalogues were tried, set by
the toolset's `OPENEO_CATALOGUE`; deployments use Ours. Studio talks to
one agent, `VITE_AGENT_URL`, so compare the two in separate sessions. Which algorithms each can run, and why the rest cannot, is in
[assistant-algorithms.md](assistant-algorithms.md).

| Assistant | Knows | `OPENEO_CATALOGUE` |
|---|---|---|
| **Ours** | the 17 openeo-udp algorithms we wrote Studio code for | `udp` |
| **Everything** | all 90 in the APEx catalogue, 19 of them with code | unset |

Every prompt below gave the expected cards on both assistants, except those
under [Everything only](#everything-only): the prompts that make a change were
run twice on each, the rest once. The ways to break the NDVI under
[Debugging](#debugging) were run on the Everything assistant only.

The assistant changes nothing by itself. A change comes back as a card with
**Accept** and **Reject**: a diff for the code, or a `before → after` list for
the Configuration tab. While the assistant is still working, a proposal shows
as one line; the cards come after its answer, with **Accept all** when there
is more than one. Once the last card is accepted or rejected, the project runs
and saves, like the Save button, if any card was accepted.

## Before you start

- **Rename the project** from "New Project" before you save. Project ids are
  shared by every user of the backend, so `new-project` is taken
  ([titiler-openeo#469](https://github.com/sentinel-hub/titiler-openeo/issues/469)).
- **Run the code** before asking about an error. **Ask the assistant** sends
  what the last run recorded, including which step failed: running the code,
  validating the graph, creating the map, or saving.

A working NDVI to start from, with the bands configured as `B04`, `B08`:

```python
def ndvi(bands):
    red, nir = bands[0], bands[1]
    return (nir - red) / (nir + red)

ndvi_cube = reduced.reduce_dimension(dimension="spectral", reducer=ndvi)
scaled = ndvi_cube.linear_scale_range(-1, 1, 0, 255)
add_graph_to_map(scaled.save_result("PNG"), "NDVI")
```

## Setting up (Configuration tab)

These should give a configuration card: collection, bands, dates, area and
cloud cover, checked against the backend first.

- Set the configuration for NDVI over Milan in July 2025 with little cloud. My
  code already does NDVI.
- I want a true-colour image of the Nile delta last spring.
- Show me Lake Geneva in winter 2024.

The Nile delta also gives a code card, replacing the NDVI with a true-colour
image, because its bands change; Lake Geneva keeps the bands, so it gives the
configuration card alone. Asking for NDVI without saying the code already does
it may get Kernel NDVI from the catalogue instead, on the Ours assistant.

## Debugging

Break the working NDVI above in one of these ways and run it. Where the run
fails, press **Ask the assistant** on the error; where it does not, ask the
question in the last column. Each should end in a code card that fixes it.

| Break it | What you should see |
|---|---|
| `dimension="bands"` instead of `"spectral"` | Fails as it runs: `Invalid dimension 'bands'. Should be one of ['x', 'y', 't', 'spectral']` |
| `bands[1], bands[2]` instead of `bands[0], bands[1]` | Runs, then renders nothing; ask "Nothing renders on the map, though the layer is in the layers list." The fix restores `bands[0], bands[1]` |
| A line `extra = datacube.band(2)`, with two bands configured | Fails as it runs: `Invalid band name/index 2. Valid names: ['B04', 'B08']`. The fix deletes the line |
| Drop `.save_result("PNG")` | Runs, then renders nothing; ask "Nothing renders on the map, though the layer is in the layers list." The fix puts it back |
| Drop `linear_scale_range` | Runs, then renders dark, as NDVI is −1 to 1, not 0–255; ask "Why is my map all black?" The fix is `linear_scale_range(-1, 1, 0, 255)` |

Or ask directly:

- My layer fails to render. What's wrong? Fix it.
- Nothing renders on the map, though the layer is in the layers list.
- Why is my map all black?
- Which dimensions does my cube have after each step?

## Published algorithms

Asking for an algorithm with code should give a configuration card and a code
card replacing the whole file, with no code written by the model.

- Show me snow cover over the Alps around Innsbruck in February 2025.
- Map the burned area from the 2025 fires near Athens.
- Detect clouds in my current scene with the Hollstein method.
- Is there a published water-quality algorithm I can use on Lake Garda?
- Which published algorithms work with Sentinel-1?

### Everything only

The Everything assistant also knows the [APEx algorithm
catalogue](https://algorithm-catalogue.apex.esa.int/). Two of its other
providers' algorithms come with code: a line calling `algorithm(url)`, a
loader helper that runs the published process graph on this project's area,
dates and cloud cover. The rest it describes, with why they cannot run here.

- Show me the dust index over the Sahara coast of Mauritania in July 2025.
  Gives Terravision's NDDI; the Ours assistant has no dust index and
  improvises one from Sentinel-5P.
- Is there a published soil-moisture algorithm, and can it run here? Finds
  VITO's, and says it needs two time windows where Studio has one; the Ours
  assistant finds none.

## Writing code

These should give a diff card for the lines that change, not the whole file.

- Use `datacube.band("B08")` style instead of indexes.
- Rename my layer to "Vegetation".

## Finding things

Lookups only; these change nothing.

- Which collections here have elevation data?
- What bands does sentinel-2-l2a have?
- Which process masks clouds, and what arguments does it take?
- Is there a built-in ndvi process I could use instead of my own?
- What date range does sentinel-1-rtc cover?

## Both at once

Should give a configuration card and a code card.

- Change my NDVI to NDWI, and set the bands it needs.
- Use red, green and blue in that order, and allow up to 30% cloud.
- Switch to Landsat and keep the same area and dates.
- Add a second layer showing the cloud mask.

Switching to Landsat may first be refused for keeping Sentinel-2 band names;
the assistant then proposes Landsat's (`red`, `nir08`) with code that reads the
bands by name. The cloud mask adds the `SCL` band and a second layer.

Without "set the bands it needs", NDWI changes only the code and leaves the
NDVI bands configured.

## What to watch for

- **No repeated summary.** After a card, the answer should be a sentence at
  most, not a restatement of the card or a code block.
- **Reading before editing.** Every edit to your code follows `read_code`, or
  `check_project` when debugging; the edit tool refuses one without, so a
  missing read is a bug. A published algorithm replaces the code without
  reading it.
- **Debugging in two steps.** An error should take `check_project`, which
  traces, validates and lists the code in one call, then the fix.
- **Indexes from 0.** Band indexes on a code card count from 0 in the
  configured order. The tool refuses one the configuration does not load.
- **Images out.** New layers scale to 0–255 and end with `save_result("PNG")`.
- **Code, not configuration, for code problems.** A dimension name or band
  index is fixed with a code card, never a configuration card.
- **Published code never passes through the model.** A published algorithm
  is one `propose_algorithm` call naming the stored algorithm; Studio reads its
  code from the agent's state. A `propose_code_edit` carrying a published
  algorithm's code is a bug.
- **Real names only.** Bands and processes on a card should be ones the
  backend has (`red`, `nir`, `B04`), not names from another backend.
