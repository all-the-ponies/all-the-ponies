# Optional 3D model viewer (draft)

This draft adds an optional entry to the existing pony, pet and costume detail pages. It reuses
ATP's `ObjectPage` action slot, translated object name, `DialogComponent`, buttons,
asset URL resolver and i18n. GLB downloads use the current appearance and bake
selected animations on the client.
Valid detail pages show the 3D button and load the catalogue when it is clicked.
Existing inventory/variant controls are unchanged. Costume entries use verified
native outfit models or standalone native part previews without inventing an owner.
Pony entries may also provide an optional, owner-specific wardrobe bundle.

## Run the demo with game models

Use this ATP PR together with [game-data PR #1](https://github.com/all-the-ponies/game-data/pull/1)
(`MeltyRio/game-data`, branch `codex/3d-resource-association`). Conversion and
native discovery belong to game-data; ATP does not have a Python converter.

In a new review directory, check out the ATP PR branch:

```sh
git clone --branch feature/3d-model-viewer --single-branch \
  https://github.com/MeltyRio/all-the-ponies.git atp-3d-review
cd atp-3d-review
```

Use Node.js 22.12 or newer and pnpm 10.28.2. First obtain a completed local
output from that game-data branch. It must contain
`models_3d.json` and every referenced file under `models/3d/`. Existing upstream
outputs without the new catalogue cannot provide 3D models. Model and animation resources are
not included in either PR; the demo reads resources you have generated locally.
If you already have that output, you do not need Python, ARK files or an APK to
run the viewer. Otherwise follow the producer's
[review input checklist and offline build](https://github.com/MeltyRio/game-data/blob/codex/3d-resource-association/docs/3d-resource-associations.md#prepare-real-game-resources-for-local-review)
first; one isolated RK/ANIM pair is not enough for its normal pipeline.

From the ATP checkout, install with the frozen lockfile and start the demo:

```sh
pnpm install --frozen-lockfile
export MODEL_VIEWER_ASSETS="/absolute/path/to/game-data/dist"
pnpm demo:model-viewer
```

Open `http://127.0.0.1:5195` in a browser. No domain, bucket or deployment is needed.
This address refers to the computer running the command: another reviewer starts
their own local server, rather than connecting to the contributor's localhost.
The page lists the actual catalogue identities. Search for an Object ID, select
it and use the 3D button to open ATP's real viewer. Pony, Pet and pre-generated
Costume entries use their own IDs; costumes may use native names such as `SET_*`.
Only generated entries appear. An explicitly requested missing identity shows a
message and never substitutes another model. For a direct link, for example:

```text
http://127.0.0.1:5195/?identity=Pony_Twilight_Sparkle
```

The selected entry must exist in that catalogue. Animation buttons play its
supported clips once, then restore rest. Every valid clip in the verified native
library is considered; actions that need unsupported events remain excluded with
a producer diagnostic. Catalogue-preferred non-generic actions appear first,
followed by name order, with bold text. Number and direction
variants share collapsible menus styled with ATP's sidebar component; every
original clip remains independently playable. Flight variants stay separate.
The lock switches horizontal/free rotation, and Reset restores the view and pose. Supported additional actors and
native materials load with the selected resource; they do not need separate demo
switches. If the pony has a wardrobe bundle, expand **Wardrobe** to load its
parts. Browse the vertically scrolling outfit grid below the model. Selecting
an outfit replaces that grid with its head, body and available tail parts on a
single scroll background in the same bounded area. Select individual parts;
the round back control restores the grid, its scroll position and the focused card.
Cards use the native set-card background and ATP's outfit names, bonuses and
part thumbnails. Only declared parts are shown. Pony pages preserve the owner's
native costume-array order; model-only demos use the bundle's set order.
Browsing an outfit keeps the current mix. The demo uses native IDs when the
full ATP game-data labels and thumbnails are unavailable.

For a first check, select `Pony_Twilight_Sparkle`, open the 3D viewer and click
`gen_idle_00` if listed. The model starts at rest; parent animations do not
autoplay. This pony and that clip were verified with retained 11.4.3c inputs.
Other verified examples are `Pet_Winona`, `SET_TW_1` (a complete costume),
`Pony_Auto_Jack` (an additional actor) and `Pony_Princess_Celestia` (hair material).
They are examples, not assets bundled with the demo or a guarantee for every
input version. Use only entries and actions actually generated in your catalogue.

Keep the terminal running; Ctrl+C stops the local servers. `MODEL_VIEWER_PORT`
overrides the page port. Missing `MODEL_VIEWER_ASSETS` or an unreadable catalogue
stops startup with instructions. There is no built-in model or generated fallback.
Restart the demo after regenerating the catalogue.

The page uses the actual ATP viewer/dialog components, without booting the whole
ATP site. A test-only asset resolver serves the selected output from a second
local HTTP origin to exercise CORS and manifest serialization. Production keeps
ATP's existing `createAssetUrl`; this demo does not upload or contact its CDN.

### Generate a local output when needed

Use game-data's [setup and build instructions](https://github.com/MeltyRio/game-data/blob/codex/3d-resource-association/README.md).
The [review input checklist](https://github.com/MeltyRio/game-data/blob/codex/3d-resource-association/docs/3d-resource-associations.md#prepare-real-game-resources-for-local-review)
includes the exact branch, native resource categories, directory layout and an
output check for Twilight and her animations. Use its local commands, not the
README's upload example or the Docker image's default upload command.
The normal build runs Transformer and then model generation. For a local review,
use complete, successfully extracted inputs for one fixed game version and an
isolated raw/output directory. For example, from the game-data checkout:

```sh
uv run --no-sync game-data --env dev build \
  --version 11.4.3c \
  --raw /absolute/path/to/isolated-raw \
  --output /absolute/path/to/new-review-dist \
  --skip download extract image_gen
```

Replace the version with the actual input version. The raw directory must contain
`extracted/` with all inputs needed by Transformer and model generation, not just
one RK/ANIM pair. The build writes its private model report under raw and clears
the specified output before Transformer, so use a new output path. Skipping
`image_gen` only skips the later image stage: Transformer can still need its
normal image/SWF tools. Do not add `--skip transform` for an empty output.
This command does not request uploads. Point `MODEL_VIEWER_ASSETS` at the resulting
`new-review-dist`, without copying game files into the ATP checkout.

If an expected identity is absent, inspect `isolated-raw/model-associations.json`
(`generation.excluded` and `identities[ObjectID]`) for its actual dependency or
support diagnostic. If the viewer reports a missing file or format error,
check that the catalogue and the entire referenced `models/3d/` tree came from
the same completed build, then restart the demo. Do not rename another model to
the missing ID or combine a new catalogue with old GLBs.

## Wardrobe

The pony viewer loads `model.wardrobe` only when its controls are opened. This
optional schema-4 asset uses `models/3d/<ObjectID>_wardrobe_<sha256>.glb`, matching
its owning model's Object ID and the bundle's digest. It uses the same rig and
shared animation references as the normal model. Old catalogues without it keep
working; costume pages retain their pre-generated complete previews.

The bundle's `atpWardrobe` extras contain owner-local sets, three default part IDs,
and each part's slot, native mesh indices and optional linked part. Selection
uses the native Body/Mane/Tail order and LinkedPart cleanup. An undeclared set
slot stays unchanged; an explicit part with no mesh is a valid empty appearance.
Only directly declared parts become buttons. The alternative-context-only
`SET_TW_6` remains a standalone preview, outside the ordinary Twilight wardrobe.

Once the wardrobe is loaded, changing clothing preserves the current action,
its playback position and native events. The initial bundle replacement still
stops the current action. Animations, blinking and Reset view retain the selected clothing. Default
parts remain available from the native default outfit. Supported additional actors keep
their existing animation and follow the replacement owner model. This is a
visual preview without cross-character clothing or crafting; the download uses
the currently selected mix.

## Tests

The Node unit tests use small self-authored in-memory data and need no game assets:

```sh
pnpm test:model-viewer
```

With the same real output selected above, check the referenced GLBs against the glTF format:

```sh
pnpm test:model-viewer:glb "$MODEL_VIEWER_ASSETS"
```

Use the demo to check appearance, animation playback, interactions and Reset in
a browser. Generated game resources stay outside the checkout. Do not run upload
tools against a partial test output.

For the full site, use ATP's normal development/build instructions and configured
data environment. Run its build and type checking separately; the demo is not a
replacement for those checks or production delivery acceptance.

## Data and hosting contract

The companion game-data change generates `models_3d.json` after Transformer,
using Luna GameObjectData and the same extracted inputs. It writes current
model objects under `models/3d/<ObjectID>.glb` and independent animations
under `models/3d/anim/<sha256>/<native-clip-name>.glb` into the existing complete `dist/`.
Model and embedded texture updates replace the same Object ID key. Animation
digest directories distinguish different native libraries with the same clip
name, and preserve an animation when its content changes. Shared clips retain the same key
across characters. Internal additional actors without a game Object ID keep
their flat `models/3d/<sha256>.glb` model key. The reader also accepts previous
flat SHA keys and SHA-directory model keys. Names use
ASCII letters, digits, underscores and hyphens; unsupported names are diagnosed
by the generator rather than silently rewritten.
The current upstream game-data version must include that change before this
consumer has generated game resources to display.

Its existing sync process validates the catalogue's local references, uploads
referenced GLBs first, then the catalogue, and finally the root manifest. The
manifest records the hash of the **uploaded, reserialized** catalogue JSON.

Valid Pony, Pet and Costume detail pages show the 3D button directly. The
launcher reads the manifest and full catalogue only when the button is clicked.
Loading remains visible during initialization. A loading failure closes the
viewer and releases its resources; the button remains available.
The loader shares one catalogue version and in-flight request, with independent
caller cancellation. It releases the parsed catalogue after 60 seconds without
a metadata request; selected model descriptions are cloned for each session.
The viewer does not compare those JSON bytes to a pre-upload digest. Each GLB
has a checked byte count and rig compatibility metadata; its SHA-256 identifies
the generated asset without being recomputed in the browser.
Embedded textures and buffers prevent hidden external GLB dependencies.

Fixed model keys use `Cache-Control: no-cache` and the viewer requests cache
revalidation. Hash-versioned wardrobe, animation and anonymous model keys retain normal caching.
Publishing is not atomic: a failed upload can replace some model files while
leaving the previous catalogue. An old catalogue may then fail its size or
rig check. After publication finishes, reloading the page reads the latest
catalogue and resources. The viewer does not provide historical model snapshots
or automatically retry failed loads.
Retention and eventual deletion of old immutable GLBs remain an upstream
operational decision. ATP adds no upload,
cleanup, native-resource downloader, game-object resolver or native parser.
Production R2/CDN delivery and cache behavior have not been accepted by these tests.

The initial production release uses `eventBinding` version 2. Coordinate the
first release of this viewer with the matching game-data producer: make the
viewer available before publishing its first v2 catalogue and referenced assets.

The catalogue is fetched when opening the viewer with `credentials: omit`;
Three.js and WebGL initialize at that point. Relative keys are resolved with
ATP's CDN-aware helper. External URLs/path traversal in catalogue entries and
external buffer/image URIs inside GLBs are rejected. Hosting must allow browser
GET/CORS and deliver GLB bytes unchanged. CSP/cache/deployment policies remain
owned by ATP.

The reader accepts catalogue versions 1, 2, 3 and 4. Version 2 is required for an
additional actor or a native material UV clock; a plain catalogue remains version
1. Version 3 adds the optional native interaction profile below. Version 4 adds
per-model animation event bindings alongside reusable skeletal GLBs. The initial
production contract uses version 2 of these bindings.
The same upload reference checks include the additional actor's model and clips.

Schema 4 can store shared animation references once in the optional top-level
`animationAssets` array. Each entry is a complete animation reference, including
its optional `eventBinding`. A model or additional actor's `animations` list then
uses integer table indices or legacy inline references. Only identical complete
references are shared, preserving each model's event targets. The reader expands
only the selected model and its additional actor, reuses the table objects, and
applies the same resource, animation ID and rig checks. Compact references require
schema 4; invalid indices, missing tables and binding wrappers are rejected.

## Model and animation boundary

A model GLB contains mesh, embedded texture, material, bind matrices and rest
skeleton, but no animation. Verified PonyBook previews use the first frame of the
native Conversation idle on opening, action completion and Reset, without parent
autoplay. World previews and pets use their own producer-selected rest poses.

An animation GLB contains joints and standard STEP tracks, plus optional native
interpolation samples, but no mesh or texture. Both use ordinary glTF 2.0
structures plus small extras:

- `atpRig`: version, coordinate convention, indexed hierarchy and compatibility
  key derived from the explicitly selected native animation library content.
- `atpClip`: native FPS, frame count and duration; optional `nativeSampling`
  version 1 references FLOAT VEC3 positions and VEC4 raw XYZW quaternion
  accessors in frame-major, joint-major order. Model-specific callbacks and
  visibility curves live in catalogue animation `eventBinding` entries.
- `atpInteractions`: model-side native eye and SubObject mesh indices, hidden
  node indices and any embedded finite emitter definitions/textures. Nodes outside the
  default scene are loaded explicitly with the same skeleton; their declared
  visibility is applied before material setup, camera fitting or first render.
- `atpNativeDepth`: native material depth test/write flags not represented by
  standard glTF material fields.
- `atpNativeUVClock`: the reviewed native hair controller's initial value, speed
  and range. Its texture offset uses `KHR_texture_transform`; a shared runtime
  clock reproduces the native update and reset-at-maximum rule.

The viewer checks these records, hierarchy, node associations, track channels,
STEP interpolation and sample times before rebinding tracks to model node UUIDs.
It does not infer compatibility from a character's name or bone count. This
profile is intentionally conservative: it is not a general retargeting system.
Changing a native library invalidates its rig identity even if only one clip
changed. The caller still must establish the RK/library association from native
metadata; these formats alone do not prove that any arbitrary pair belongs
together.

For `nativeSampling` version 1, the viewer interpolates the original model-space
positions linearly and raw quaternions with shortest-path normalized linear
interpolation, then derives parent-local transforms for the existing Three
mixer. Quaternion endpoint lengths are retained; normalizing before mixing or
using parent-local SLERP would change the reviewed native result. Tracks share
one native pose calculation for each mixer time. The final frame
remains held through the existing clip duration, and completion/Reset behavior
is unchanged. This does not implement the game's multi-layer animation or queues.

Older clips without `nativeSampling` continue to use STEP. Invalid or unknown
sampling metadata is rejected rather than silently downgraded. Ordinary glTF
viewers can still read the standard STEP tracks in new files. Regenerate local
game-data output to exercise native interpolation; existing GLBs do not contain
the original compressed quaternion lengths and cannot recover them from matrices.

Each parent clip is fetched only when first selected, then reused within that viewer
session. Content-addressed assets can use ordinary HTTP caching across sessions;
there is no additional persistent application cache or large shared library
pre-download. Closing releases the session cache and GPU resources.
Loading is exposed through `aria-busy` without a flashing text message;
downloading a clip does not resize or recenter the open dialog.

## Declared additional actors

Game-data can supply one `additionalActor` from the selected native object's
`AdditionalObject` declaration. The client consumes the generated reference,
rest matrix, parent root ordinal and `native-first-then-random-v1` controller;
it does not resolve native resources or infer ownership. The child has its own
rig, mixer and original CSV clip order: first index zero, then a random index
at each completion. It may repeat an index. Clips are fetched on demand and do
not enter the parent's action menu.

The scene uses native scale/offset/LockRotate fields and parent-root X/Z motion.
These are adapted from a stationary world actor to an uncompressed free 3D
preview, as documented by game-data's `docs/3d-additional-actors.md`. This is not
a reproduction of every native UI. Orbit views the complete scene; it does not
change the native fixed-heading reference. Single-sided planar effects remain
single-sided and can appear edge-on or disappear from their reverse side.
Initial framing includes both actors, so a large or distant child can reduce
the parent's on-screen size. Motion can still exceed initial bounds.

The child plays while the parent rests and shares page-hidden pause, rendering,
cancellation and disposal. Reset view restarts its first clip. A failed initial
child load fails the complete scene and releases partial resources. A failed
later clip is reported; it never substitutes an unrelated clip. The verified
hair UV clock also runs while the parent rests and pauses when the page hides.

## Interaction and lifetime

Default mode keeps the initial camera elevation, target and size: horizontal
mouse/single-finger dragging or left/right keys rotates around the model. The
small lock button uses ATP's native blue button style; the closed/open SVG shows
the current locked/free mode. Free
rotation enables vertical orbit and zoom without interrupting a playing action
or resetting the current view. Switching back, or pressing Reset view, cancels
pending/running animation, restores the rest pose, and resets camera position,
target and scale. There is no per-frame auto-follow or zoom.

Selecting a clip plays once; selecting it again replays it. Completion restores
the exact rest transforms after the mixer's update. Abort signals and a request
generation prevent late responses from reviving canceled actions. Unmount
removes controls/listeners/observers, stops RAF, aborts requests, releases
textures/meshes/skeletons/mixer state and destroys the WebGL context. GPU creation
is deferred to mounted client code, so SSR does not require WebGL.

Controls retain ATP's gradient and menu dark-fill focus feedback without an
additional browser outline.

### Native PonyBook interactions

Regenerated game-data output may provide `interactions: {version: 1,
clickAnimations: [...], dizzyAnimation?: id}` for a Pony or its pre-generated
Costume. ATP does not infer these lists from names. Pets and older catalogues
keep their existing playback controls.

The model profile carries the producer's verified `blink` capability alongside
its eye groups. The viewer uses this source capability, independently of whether
all corresponding geometry survives conversion, with a 2–5 second open interval
and a 0.1 second closed interval. An empty rendered eye state still hides other
eye groups and retains `EyeSet` expression/EnableBlink changes and the native
blink timer. No eye geometry is invented. Events use integer native frames;
pose interpolation remains independent. Every crossed event runs in source
order, including frame zero.

A mouse click or single-finger tap must hit the currently visible skinned
model. Blank space, dragging, cancellation, modifier/right buttons and multiple
fingers cannot trigger an action. The viewer chooses among the supplied native
click entries, excluding the current action when another is available. This is
a viewer policy over native allowed actions, not a reproduction of the game's
remote-service random gate or directional action selection.

Four qualifying horizontal rotation releases play the supplied dizzy action.
Each release uses signed displacement modulo 360 degrees and must be strictly
over 220 degrees; its final pointerup displacement counts. Both locked and free
rotation use this rule. Reset and mode changes clear the count. There is no
fallback when the producer cannot validate that action or all of its events.

The reviewed `mlp_arena_pony_defeat_02` event renders the original embedded
texture and finite particle parameters as an additive, camera-facing effect
at the model origin. No head-bone attachment or replacement artwork is guessed.
A native dizzy action with no such event does not acquire synthetic stars.
Normal clip completion restores the rest pose/default eyes and lets an active
particle burst finish. Reset, replacing an action and closing clear the effects.
Eyes, effects, poses, material clocks and companions share the existing paused
page clock and resource lifecycle. The producer's source evidence and exclusions
are described in game-data's `docs/3d-resource-associations.md`.

## Review scope and limitations

This is a basic playback consumer. Native source discovery and default/outfit
selection belong to game-data; a missing catalogue identity closes the viewer
while leaving its 3D button available.
Full creator packages, recursive companions, general native event
execution, task scenes and character-family action sorting are outside the viewer. One explicitly declared additional actor is supported as described above.
Only the versioned parent EyeSet/SubObject/finite-emitter profile described here executes.
Unknown events, unresolved event dependencies and eventful independent companions
are rejected rather than silently rendered without their behavior. In addition to ordinary materials,
game-data recognizes native horn and hair shaders by their declared shader
and supported controller: the inactive horn surface is represented by an alpha mask, and hair uses
the verified UV clock. Unknown shader/controller combinations still fail; this
is not general native shader execution. Future formats require investigation and
tests. Standard glTF validation cannot prove native-game visual equivalence.

The focused unit tests use synthetic inputs for the core asset, animation and
interaction contracts. Real-model visual review uses locally generated game-data
output through the demo. Physical iOS/Safari remains unverified. English strings
use ATP's usual fallback; additional translations are deferred.

The small GLB extras profile remains a review point for this Draft PR. Generation
is owned by game-data. No new registry package, independent Luna Kit PR or
resource hosting system is added. This source is GPL-3.0-only like
ATP; Luna Kit is GPL-3.0, Three.js is MIT, NumPy is BSD and Pillow is MIT-CMU.
Third-party code and model/animation resources are not vendored. The native
wardrobe scroll is a regular static UI asset at
`src/assets/images/ui/native-wardrobe-set-card.png`, referenced by component CSS
and bundled by Vite alongside ATP’s existing game-derived UI artwork. It is never
extracted during a build or fetched from the model catalogue.

The viewer's lock and export controls use ATP's `button-circle button-blue`
classes at the same 2rem diameter as the Back button. `ui/icons/download-icon.png`
is the white foreground layer from PonyBook's `MoveToInventiryBtn` (shape 297),
with transparent margins trimmed; the native blue background is excluded. It
uses the same static image reference pattern as ATP's other button icons.


### Native SubObject visibility and shared clips

game-data keeps skeletal animation GLBs reusable across models. Both cached and
uncached conversion emit model-specific `eventBinding: {version: 2, events: [...],
visibility: [...]}` on each event-bearing catalogue animation reference. `events`
contains EyeSet expression/blink settings and finite Emitter callbacks. The
`visibility` array follows this shape:

```json
[{"meshName": "wings", "times": [0, 1.5, 3], "values": [false, true, false]}]
```

The producer resolves native SubObject and EyeSet writes against the retained
model. `meshName` is the original mesh name, `times` are seconds (`frame / fps`),
and `values` are booleans. Curves start at the model default and fold frame-zero
and same-time writes in native source order. Later keys are retained even when
their value repeats, because a native write also ends a procedural blink override.

ATP directly consumes these curves for both preview and download. At load time
it creates runtime-only `BooleanKeyframeTrack`s targeting the resolved object's
UUID `.visible` property. Float64 times retain exact native boundaries. Hidden
eye/prop nodes are attached before binding; generic readers of the source model
still see its static pose. No event-to-curve conversion runs in the frontend.
Animation GLBs contain skeletal data; model-specific visibility and callbacks
are carried by the catalogue binding.

The eye controller keeps expression and blink timing, while the mixer writes
tracked eye visibility. A blink supplies a track override until the next native
visibility key; seeks and loops clear it before sampling. Untracked eyes and
finite emitters retain their existing controllers. STEP and native transform
interpolation are unchanged; loading no longer recomputes every source pose for
comparison with the standard animation channels.

Restart, Reset, animation changes and returning to rest restore default meshes.
The runtime controller provides `seek(seconds)`, `setLoop(boolean)` and `replay()`;
button playback remains once by default. Seek reconstructs eyes/effects at the
requested local time (wrapping in repeat mode), including after completion.
Actual action-local time and loop cycles drive callback reconstruction. Completion
restores defaults after mixer evaluation while preserving the finite effect tail.
Late emitter events initialize at their original event time and advance by their
elapsed age; already-expired events allocate no particle instance. On-time events
retain native emission on the first positive update.
`preferredAnimations` is an optional model-level list of exported animation IDs.
Its non-generic entries are promoted and marked in the menu without changing
which clips are available.


## Client-side GLB download

The circular download icon at the preview's bottom right enters a temporary export
selection mode. The lock remains at the top right. Normal viewing hides all export
selection controls. Export mode reuses the animation list and its collapsible
groups, with the standard inventory-style green plus/red minus buttons. Selecting
an animation does not play it; clicking its name still previews it. Group and
Select All controls operate on the complete stable-ID collection, including
collapsed groups. A partial group shows a green plus without clearing its children.
The download icon shows a red count badge only when pony animations are selected;
it counts individual clip IDs, including all children of selected groups.

The Export button snapshots the currently equipped appearance and selected clip IDs.
With no selected pony animations it downloads the pony without animation; otherwise
each selected ID becomes a separate named glTF animation in one self-contained GLB.
When a companion is available, every download includes its model and complete
native animation library independently of the pony selection; no extra control is shown.
Combined downloads name clips `pony/<id>` and `companion/<id>`. Each clip retains
its own duration and targets only its actor; no combined loops or random playback
schedule are exported. The companion's fixed placement encloses both its mesh and
independent skeleton, without following the pony's animated root.
Cancel or successful export clears this temporary selection and returns to normal
viewing without changing the pose, outfit or expanded animation groups. Cancel
and closing the viewer abort pending work. Opening another identity starts fresh.
Export errors remain visible for retry. No explanatory disclosure is shown in
the viewer. The title is plain ATP blue text with compact top spacing; the
wardrobe back control appears only while the wardrobe is open on outfit parts.

The exporter is lazy-loaded on final confirmation. It reuses validated source
JSON and binary data, including original embedded textures, rather than serializing
the live renderer. Unused wardrobe nodes and unreferenced vertices are omitted;
shared geometry attributes, textures and animation samplers are reused. Pony
pages export the current mixed outfit. Individual costume pages export their
existing complete appearance. No production GLB, catalogue or producer contract
changes are needed. The exporter retains source image bytes. Only download copies of BLEND materials
with a fully opaque base-color image, unit material alpha and no RGBA vertex colors
are changed to OPAQUE. Mixed-alpha images and MASK materials retain their semantics.
Images are decoded from embedded source bytes once per export and released after
inspection, independently of preview ImageBitmap disposal.

Native custom skeletal interpolation is sampled once per pose at 60 Hz into
standard translation/rotation tracks; existing ordinary STEP tracks remain STEP.
Preview and export consume the same producer-generated `{meshName, times, values}`
array. Each original mesh name resolves to every matching glTF mesh node, retaining
the names without numeric suffixes. Every included controlled node receives its
own visibility channel. Preview binds named curves to actual scene objects and
uses discrete Boolean tracks, with a procedural blink override for eye meshes.

Explicit native SubObject and EyeSet writes become standard STEP scale channels
at their frame/fps boundaries (subject to glTF Float32 timestamp precision).
Independently controlled skinned meshes use private joint branches so hiding a
prop or eye never scales the shared body skeleton. Visibility scales target
ordinary parent nodes. Branches reuse the same skeletal animation samplers.
Every clip writes each included branch's initial visibility to avoid state
leaking from another clip. The source coordinate-root rotation is retained.
A shared nonzero skeleton root supports Blender import even when a part starts
hidden. No converter-specific hold keys or coordinate-root baking are applied.

This preserves supported native eye expressions and clip-specific eye changes.
It does not synthesize random/procedural blinking, particles, scripted events or
native shader/UV clocks. Those effects remain preview features. Companion skeletal
motion uses the same native sampling path as pony clips. Blender imports the
standard clips as Actions with stashed NLA tracks; users choose the actions to
play on each armature independently.
Original textures, genuine transparency and KHR_materials_unlit are retained without
converting unlit surfaces to emissive PBR materials for a particular importer.
Single-sided materials, including inverted hull outlines, require the importing
renderer to honor glTF backface culling. Blender Material Preview/EEVEE does;
Cycles does not reproduce that culling automatically and may need material setup.
The GLB does not require an ATP runtime or Blender add-on.

Focused checks cover selection semantics and native visibility boundaries.
Representative real Applejack mixed-outfit model-only, single-clip and three-clip
exports were loaded independently with Three.js and validated by Khronos with
zero errors/warnings. Blender 5.2.2 imported the three-clip file with separate
Actions, a usable armature, costume skinning and native prop/eye transitions.
Local browser interaction checks cover entry/cancel/success, keyboard focus,
selection versus playback, current outfit and independent costume downloads,
and desktop/390px layouts. These are representative checks, not a claim that all
models, large selections or physical mobile browsers have been tested.

References: [Three.js GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html)
for explicit animation selection and binary export, and the
[glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
for supported animation targets, STEP interpolation and skin transforms. A small
source-data writer is used here to preserve original texture bytes and avoid
losing ATP's native interpolants through generic scene serialization. No new
package or copied third-party implementation is introduced. No Blender-specific extension is required for this download flow.


GLB does not store Blender's Object Mode, viewport shading or scene colour
management. Those settings belong to a .blend file. Blender's importer maps
alphaMode BLEND to its Blended surface method, which can cause sorting artifacts
when opaque surfaces and translucent accessories both use BLEND. Spike and Coiffed comparisons
confirmed that Dithered restores the texture appearance without changing the GLB.
Blender also activates the first imported action above its stashed NLA tracks;
select the intended action or solo its NLA track to preview another clip. The user
confirmed Coiffed's appearance and animations after these Blender-side adjustments. The exporter does not embed Blender-specific setup or
Apple GLB-to-USD workarounds.


### Resource processing and review boundary

The catalogue is validated when resolving an identity, including allowed asset
keys. GLB loads check the response size and format, then reject external buffers
or images before invoking the loader. Native animation
timing and rig compatibility are checked in `bindAnimation`; the playback
controller reuses that result instead of checking duration again.

Playback keeps bound clips only for the current model. Export owns its temporary
animation resources and releases them after baking. A representative two-clip
local measurement put each fetch/parse and binding step at roughly 4–5 ms, so
there is no additional persistent cache or export/preview shared ownership layer.
The exporter packs its existing chunks directly into the final GLB, avoiding an
extra full binary-buffer allocation and copy. These are local measurements, not
network or mobile performance guarantees.

### Skin weights

The viewer uses standard `JOINTS_0` and normalized `WEIGHTS_0` for CPU and GPU
skinning, reusing game-data conversion and GLTFLoader's load-time normalization.
The same loading path serves pony models, wardrobe bundles and additional actors.
This avoids deformation artifacts from underweighted native vertices, including
Coiffed's scarf and hind legs.

Downloads retain the standard weights and, when present, the original
`_NATIVE_JOINTS` / `_NATIVE_WEIGHTS` attributes. The custom pair does not override
viewer skinning.
The converter removes fully collapsed zero-weight triangles before export and
rejects retained zero-weight vertices rather than inventing bone influences.
