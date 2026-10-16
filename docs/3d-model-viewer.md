# Optional 3D model viewer (draft)

This draft adds an optional entry to the existing pony, pet and costume detail pages. It reuses
ATP's `ObjectPage` action slot, translated object name, `DialogComponent`, buttons,
asset URL resolver and i18n. It does not add a parallel website or a downloader.
No catalogue entry means no 3D button. Existing inventory/variant controls are
unchanged. Each page looks up its object ID in the same catalogue; a costume
entry represents a verified, complete outfit model, not an interactive wardrobe.

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
outputs without the new catalogue cannot provide 3D models. Game resources are
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
a producer diagnostic. Object-declared preferred clips stay first and use bold
text and a light edge in the list. The lock switches horizontal/free
rotation, and Reset restores the view and pose. Supported additional actors and
native materials load with the selected resource; they do not need separate demo
switches. The demo does not add unsupported game events or interactive clothing.

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
support diagnostic. If the viewer reports a missing file or integrity error,
check that the catalogue and the entire referenced `models/3d/` tree came from
the same completed build, then restart the demo. Do not rename another model to
the missing ID or combine a new catalogue with old GLBs.

## Tests

The Node unit tests use small self-authored in-memory data and need no game assets:

```sh
pnpm test:model-viewer
```

With the same real output selected above, check the GLB format and resource
integrity:

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
under `models/3d/<sha256>/<native-clip-name>.glb` into the existing complete `dist/`.
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
The viewer does not compare those JSON bytes to a pre-upload digest. Each GLB
still has a checked byte count, SHA-256 and rig compatibility metadata.
Embedded textures and buffers prevent hidden external GLB dependencies.

Fixed model keys use `Cache-Control: no-cache` and the viewer requests cache
revalidation. Immutable animation and anonymous model keys retain normal caching.
Publishing is not atomic: a failed upload can replace some model files while
leaving the previous catalogue. An old catalogue may then fail its size or
digest check. After publication finishes, reloading the page reads the latest
catalogue and resources. The viewer does not silently accept mismatched bytes,
automatically retry indefinitely, or promise historical model snapshots.
Retention and eventual deletion of old immutable GLBs remain an upstream
operational decision. ATP adds no upload,
cleanup, downloader, game-object resolver or native parser.
Production R2/CDN delivery and cache behavior have not been accepted by these tests.

Deploy this compatible reader before publishing catalogues with named keys.
An older reader that only accepts flat SHA keys cannot consume the new paths;
retaining old files alone does not update that JavaScript. No public rollout is
performed by these local candidates.

The catalogue is fetched on client mount with `credentials: omit`; Three.js and
WebGL initialize only after opening the viewer. Relative keys are resolved with
ATP's CDN-aware helper. External URLs/path traversal in catalogue entries and
external buffer/image URIs inside GLBs are rejected. Hosting must allow browser
GET/CORS and deliver GLB bytes unchanged. CSP/cache/deployment policies remain
owned by ATP.

The reader accepts catalogue versions 1, 2, 3 and 4. Version 2 is required for an
additional actor or a native material UV clock; a plain catalogue remains version
1. Version 3 adds the optional native interaction profile below. Version 4 adds
per-model animation event bindings alongside reusable skeletal GLBs. Deploy this
reader before publishing schema-4 data: older clients reject it instead of
silently omitting required interaction behavior.
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
  accessors in frame-major, joint-major order. Optional `eventProfile: "ponybook-v1"`
  carries ordered native records in older standalone exports. Normal schema-4
  output keeps model-specific events in catalogue animation `eventBinding` entries.
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
using parent-local SLERP would change the reviewed native result. Every stored
pose is checked against the standard tracks before playback. The final frame
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

When the selected native Open/Closed meshes exist, are distinct, and match the
default appearance, the viewer blinks with a 2–5 second open interval and a
0.1 second closed interval. It retains the native timer update order and
`EyeSet` expression/EnableBlink changes. Empty or unresolved eye groups do not
invent geometry. Events use integer native frames; pose interpolation remains
independent. Every crossed event runs in source order, including frame zero.

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
selection belong to game-data; a missing catalogue identity yields no button.
Interactive clothing assembly, recursive companions, general native event
execution, task scenes and character-family action sorting are outside the viewer. One explicitly declared additional actor is supported as described above.
Only the versioned parent EyeSet/SubObject/finite-emitter profile described here executes.
Unknown events, unresolved event dependencies and eventful independent companions
are rejected rather than silently rendered without their behavior. In addition to ordinary materials,
game-data recognizes reviewed native horn and hair shaders by their exact source
content: the inactive horn surface is represented by an alpha mask, and hair uses
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
Third-party code and game assets are not vendored.


### Native SubObject visibility and shared clips

The normal producer keeps skeletal animation GLBs reusable across models. A
schema-4 catalogue animation can carry `eventBinding: {version: 1, events: [...]}` with
that model's resolved EyeSet, Emitter and SubObject records. SubObject records
have `{frame, type: "SubObject", meshes: [nativeMeshIndex, ...], visible: boolean}`.
The model's `extras.atpInteractions.subObjects` lists the permitted mesh indices;
its node extras identify actual native meshes and their default visibility.
Hidden event-controlled nodes are retained outside the default glTF scene and
attached by ATP before binding. Generic glTF readers still show the static pose.

Targets come from the exact native model tag, SubObject ID and mesh name. Missing
or ambiguous targets exclude the whole affected action; the producer never
substitutes another model's prop. The reader requires retained mesh nodes for all
indices and rejects unknown event types or competing catalogue and embedded event
sources. Older GLBs with embedded `ponybook-v1` events continue to work when no
catalogue binding is present (schema 3 remains supported). Schema 4 is mandatory
for catalogue bindings so older readers reject the new contract instead of
playing event-free skeletal motion. STEP and native transform interpolation are unchanged.

ATP builds runtime-only `BooleanKeyframeTrack`s targeting each resolved mesh
UUID's `.visible` property. Per-track Float64 times retain exact native frame/fps
boundaries, and the clip duration uses native frameCount/fps. The tracks begin
with the model default, folding frame-zero and same-time writes in source order.
No visibility channels are added to glTF and the catalogue contract is unchanged.

SubObject records leave the callback stream after binding. When a SubObject
shares an eye mesh, its track also folds EyeSet writes in source order. The eye
controller keeps expression and blink timing, but only the mixer writes that
mesh's visibility. A blink supplies a track override until the next visibility
key; seeks and loops clear it before sampling. The native blink timer/phase is
retained, as with the previous reset behavior. Untracked eyes and finite emitters
continue through their existing controllers.

Restart, Reset, animation changes and returning to rest restore default meshes.
The runtime controller provides `seek(seconds)`, `setLoop(boolean)` and `replay()`;
button playback remains once by default. Seek reconstructs eyes/effects at the
requested local time (wrapping in repeat mode), including after completion.
Actual action-local time and loop cycles drive callback reconstruction. Completion
restores defaults after mixer evaluation while preserving the finite effect tail.
Late emitter events initialize at their original event time and advance by their
elapsed age; already-expired events allocate no particle instance. On-time events
retain native emission on the first positive update.
`preferredAnimations` is an optional model-level list of exported animation IDs,
used only to mark the original native preferred choices in the complete menu.
