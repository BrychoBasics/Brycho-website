Project Roadmap & Wishlist
1. Video Player Architecture
Unified UI Engine: All video players (Reel and Project Modal) must share a modular controller to handle play/pause, volume, and fullscreen states identically.

Horizontal Control Layout:

Toggle Play/Pause: Icon switches between play and pause states.

Volume Block: A rounded square with a 30% transparent white background. The vertical fill level must visually represent the volume (e.g., 60% volume = 60% fill). Must support click-and-drag to adjust levels.

Fullscreen/Shrink: Square block with icons locked to the upper-right and lower-left corners.

Exit Button: Required for the modal player (positioned far-left) to close the player and return to the filmstrip.

Technical Logic:

Autoplay & Loop: The main reel and project videos must loop automatically.

Default Audio: Project videos should initialize at 65% volume; the reel must start muted to comply with browser autoplay standards.

HLS Integration: Support adaptive streaming using .m3u8 manifests and HLS.js.

2. Layout & Responsive Framing
The 1/3 Rule:

Desktop: The background focal point (cinematographer) should be anchored 1/3 from the left.

Split-Screen/Narrow: The anchor shifts linearly to 1/4 from the left to prioritize screen space for text.

Dynamic Typography Container: Hero text and subtitles must remain centered within the remaining right-side space (2/3 or 3/4 of the width).

Controlled Zoom: Use object-fit: cover for the reel with a maximum zoom threshold (e.g., 120%). Once the threshold is hit, the section height should shrink to reveal the next section rather than letterboxing or over-zooming.

Scroll Magnetism: Enable scroll-snap-align: start for the Reel and Work sections, but allow the Hero section to scroll freely without snapping.

3. Interactive & Visual Elements
Custom Cursor: A box containing a precise plus (+) sign using mix-blend-mode: difference. Must include idle-fade logic (1-second sync between cursor and UI) and a hardware-acceleration fix for visibility in native fullscreen.

Filmstrip Interaction: Hovering over project cards must dynamically update the "Work Details" section (Title, Roles, Description) on the right.

Timeline Scrubber: A Premiere Pro-style timeline with tick marks and a progress fill that allows for manual scrubbing/jumping to timecodes.

4. Design Standards
Typography: Nimbus Sans (Adobe Fonts) for body and subtitles; Acier for primary branding.

Asset Management: Keep HLS chunks organized in specific subfolders (e.g., assets/project-name/) to prevent root folder clutter.

Communication & Development Preferences
Code Philosophy: If new features require structural changes, prioritize restructuring or renaming classes to ensure the logic "makes sense" rather than patching over old code.

Naming Accuracy: Use domain-appropriate terminology (e.g., ensure "hero" elements aren't using "reel" class names if they are distinct sections).

Interaction Tone: Keep responses direct and technical. Avoid compliments, unnecessary apologies, or overly sympathetic language.

Problem Solving: Treat user data and project history as shared mental context. Focus on immutable facts and direct implementation rather than speculative advice.