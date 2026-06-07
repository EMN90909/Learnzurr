export type AgeMode = '8-12' | '13-18';
export type ToolLevel = 'simple' | 'advanced';
export type ToolGroup = {
  id: string;
  title: string;
  friendlyName: string;
  level: ToolLevel;
  learnerBenefit: string;
  tools: { name: string; simple: string; advanced: string }[];
};

export const animationToolGroups: ToolGroup[] = [
  {
    id: 'timeline-basics', title: 'Timeline and frames', friendlyName: 'Put your story in order', level: 'simple',
    learnerBenefit: 'Helps learners arrange pictures, movement, and sound like a storybook that moves.',
    tools: [
      { name: 'Timeline', simple: 'A row that shows what happens first, next, and last.', advanced: 'Arrange frames, layers, clips, and keyframes across time.' },
      { name: 'Keyframes', simple: 'Pins that say where a move starts and where it ends.', advanced: 'Mark exact start/end values for motion, scale, opacity, colour, and effects.' },
      { name: 'Onion Skinning', simple: 'See a faint shadow of the frame before or after so motion is smooth.', advanced: 'Ghost previous and next frames with adjustable opacity and frame range.' },
      { name: 'Dope Sheet', simple: 'A timing table for moving many actions earlier or later.', advanced: 'Manage keyframe timing, exposure, and value blocks across layers.' },
      { name: 'Frame Rate', simple: 'Choose how smooth the animation looks.', advanced: 'Set playback and export frame rates such as 24fps, 30fps, or 60fps.' },
      { name: 'Looping', simple: 'Make your animation repeat like a bouncing ball or dancing sticker.', advanced: 'Set clip, layer, or timeline loops with seamless in/out points.' }
    ]
  },
  {
    id: 'animation-control', title: 'Animation control', friendlyName: 'Make motion feel natural', level: 'advanced',
    learnerBenefit: 'Lets older learners control how objects move instead of only moving in a straight, robotic way.',
    tools: [
      { name: 'Tweening', simple: 'The app fills in the missing pictures between two keyframes.', advanced: 'Auto-generate in-between frames from value changes across keyframes.' },
      { name: 'Easing', simple: 'Make motion start slowly, bounce, or stop gently.', advanced: 'Apply bounce, spring, linear, ease-in, ease-out, and exponential curves.' },
      { name: 'Interpolation', simple: 'Choose how a value changes between two points.', advanced: 'Control stepped, linear, bezier, and hold interpolation per property.' },
      { name: 'Graph Editor', simple: 'A curve view for seeing speed changes.', advanced: 'Edit value and velocity curves for precise timing and motion control.' },
      { name: 'Auto-Animate', simple: 'Move an object and Learnzur adds the keyframe for you.', advanced: 'Automatically record transform/property changes as timeline keyframes.' }
    ]
  },
  {
    id: 'object-transformations', title: 'Object transformations', friendlyName: 'Move, resize, turn, and fade things', level: 'simple',
    learnerBenefit: 'Gives younger learners the core controls needed to animate shapes, characters, captions, and pictures.',
    tools: [
      { name: 'Position', simple: 'Move something left, right, up, or down.', advanced: 'Animate X/Y/Z position values and path positions.' },
      { name: 'Scale', simple: 'Make something bigger or smaller.', advanced: 'Animate uniform and non-uniform scale for zoom and emphasis.' },
      { name: 'Rotation', simple: 'Turn an object like a wheel or waving hand.', advanced: 'Animate angle values around selected axes.' },
      { name: 'Opacity', simple: 'Make an object fade in or fade out.', advanced: 'Animate transparency values over time.' },
      { name: 'Color', simple: 'Change a shape from one colour to another.', advanced: 'Animate fill, stroke, and gradient colour values.' },
      { name: 'Skew', simple: 'Stretch a shape sideways for a funny effect.', advanced: 'Distort objects with animated skew values.' },
      { name: 'Anchor Point', simple: 'Choose the spot an object turns around.', advanced: 'Set pivot origin for rotation, scaling, and rig behavior.' }
    ]
  },
  {
    id: 'character-rigging', title: 'Character and rigging', friendlyName: 'Make characters move like puppets', level: 'advanced',
    learnerBenefit: 'Supports older learners who want characters, speaking faces, and more believable body movement.',
    tools: [
      { name: 'Rigging', simple: 'Add invisible sticks that help a character bend.', advanced: 'Create skeletal structures and bind artwork to joints.' },
      { name: 'Bones', simple: 'Bones connect arms, legs, and joints for puppet motion.', advanced: 'Build joint chains for limbs, heads, props, and character parts.' },
      { name: 'Lip Sync', simple: 'Match mouth shapes to a voice recording.', advanced: 'Map phoneme shapes to audio timing and dialogue tracks.' },
      { name: 'Facial Animation', simple: 'Change eyes, eyebrows, and mouth to show feelings.', advanced: 'Control expression sliders, blend shapes, and face pose keyframes.' },
      { name: 'IK/FK', simple: 'Move a hand and let the arm follow, or move each part yourself.', advanced: 'Switch between inverse and forward kinematics for limb control.' },
      { name: 'Constraints', simple: 'Make one object follow another.', advanced: 'Attach layers to paths, parents, targets, and motion constraints.' }
    ]
  },
  {
    id: 'advanced-effects', title: 'Advanced effects', friendlyName: 'Add magic, camera, and depth', level: 'advanced',
    learnerBenefit: 'Gives advanced learners creative effects while keeping the UI grouped and explainable.',
    tools: [
      { name: 'Particles', simple: 'Add many tiny things like rain, fire, stars, or sparks.', advanced: 'Generate particle systems with emission rate, gravity, size, and life span.' },
      { name: 'Physics', simple: 'Make things fall, bounce, or bump into each other.', advanced: 'Simulate gravity, collision, momentum, and object constraints.' },
      { name: 'Motion Capture', simple: 'Use a camera to copy real movement into animation.', advanced: 'Record body/face motion via webcam and map it to rigs.' },
      { name: 'Action Editor', simple: 'Save a walk, jump, or dance and use it again.', advanced: 'Manage reusable animation cycles and clips.' },
      { name: 'Grease Pencil', simple: 'Draw 2D lines inside a 3D space.', advanced: 'Create frame-based 2D strokes in 3D scenes.' },
      { name: 'Virtual Camera', simple: 'Move the camera to zoom, pan, or follow action.', advanced: 'Animate pan, zoom, depth, focal length, and camera paths.' },
      { name: 'Masking', simple: 'Hide part of an object to reveal it later.', advanced: 'Use masks and mattes to control layer visibility.' },
      { name: 'Blur', simple: 'Add motion blur so fast movement looks real.', advanced: 'Apply direction, radius, and shutter-based blur.' },
      { name: 'Shadows', simple: 'Add shadows so objects feel grounded.', advanced: 'Generate object and light-based shadows.' },
      { name: 'Lighting', simple: 'Make a scene brighter, darker, or dramatic.', advanced: 'Control light direction, intensity, colour, and falloff.' }
    ]
  },
  {
    id: 'editing-workflow', title: 'Editing workflow', friendlyName: 'Build faster without getting lost', level: 'simple',
    learnerBenefit: 'Keeps the creation process friendly for children while still giving older learners deeper workflow control.',
    tools: [
      { name: 'Drag-and-Drop', simple: 'Pick something up and place it on the stage.', advanced: 'Place assets, layers, clips, and keyframes quickly.' },
      { name: 'Layers', simple: 'Keep background, characters, text, and sound separate.', advanced: 'Organize assets into stacked tracks with visibility controls.' },
      { name: 'Blending Modes', simple: 'Mix layers in different visual ways.', advanced: 'Use multiply, screen, overlay, and additive blending modes.' },
      { name: 'Trim', simple: 'Cut off the start or end of a clip.', advanced: 'Adjust clip in/out points non-destructively.' },
      { name: 'Cut/Split', simple: 'Divide one clip into smaller pieces.', advanced: 'Split clips, audio, and keyframe ranges at the playhead.' },
      { name: 'Merge', simple: 'Join clips together.', advanced: 'Combine clips, layers, or selected timeline regions.' },
      { name: 'Speed Control', simple: 'Make action slow or fast.', advanced: 'Retiming, slow motion, speed ramps, and fast-forward controls.' },
      { name: 'Reverse', simple: 'Play a clip backwards.', advanced: 'Reverse playback while preserving timing and audio options.' },
      { name: 'Duplicate', simple: 'Copy a layer, scene, or keyframe.', advanced: 'Duplicate and offset selected properties or timeline ranges.' },
      { name: 'Copy/Paste', simple: 'Reuse settings from one object on another.', advanced: 'Transfer keyframes and property values across layers.' },
      { name: 'Undo/Redo', simple: 'Go back or bring your change back.', advanced: 'Maintain safe edit history for timeline and asset changes.' },
      { name: 'Snap to Grid', simple: 'Line up objects neatly.', advanced: 'Snap assets, keyframes, paths, and guides to grid/time increments.' },
      { name: 'Auto-Key', simple: 'Automatically save movement changes as keyframes.', advanced: 'Record property changes while the playhead is active.' },
      { name: 'Timeline Zoom', simple: 'Zoom in to see small timing details.', advanced: 'Expand or condense timeline scale for detailed edits.' }
    ]
  },
  {
    id: 'audio', title: 'Audio', friendlyName: 'Add sound and timing', level: 'simple',
    learnerBenefit: 'Helps learners match speech, beats, and sound effects to visual motion.',
    tools: [
      { name: 'Audio Sync', simple: 'Line up sound with what happens on screen.', advanced: 'Sync audio clips, markers, and animation events.' },
      { name: 'Waveform', simple: 'See the shape of sound so timing is easier.', advanced: 'Display waveform peaks for voice, music, and sound effects.' },
      { name: 'Audio Trim', simple: 'Shorten a sound clip.', advanced: 'Set audio in/out points and fade edges.' },
      { name: 'Volume', simple: 'Make sound louder or softer.', advanced: 'Animate gain and mix levels over time.' },
      { name: 'Mute', simple: 'Turn a sound track off.', advanced: 'Mute individual tracks, groups, or preview channels.' }
    ]
  },
  {
    id: 'preview-export', title: 'Preview, export, and sharing', friendlyName: 'Check and share safely', level: 'simple',
    learnerBenefit: 'Lets learners test their work before export and share it safely through Learnzur.',
    tools: [
      { name: 'Preview', simple: 'Play your animation before rendering.', advanced: 'Real-time playback with cached frames.' },
      { name: 'Frame-by-Frame', simple: 'Step through one picture at a time.', advanced: 'Inspect exact frames, timing, and motion changes.' },
      { name: 'Render Test', simple: 'Make a quick small version to check quality.', advanced: 'Generate low-resolution proof renders before final export.' },
      { name: 'Loop Preview', simple: 'Watch the animation repeat to check if it feels smooth.', advanced: 'Preview seamless cycles and looping regions.' },
      { name: 'MP4 Export', simple: 'Save a normal video file.', advanced: 'Export compressed H.264/H.265 video for general use.' },
      { name: 'GIF Export', simple: 'Save a moving picture for web or social.', advanced: 'Export palette-optimized animated GIFs.' },
      { name: 'SVG Export', simple: 'Save sharp vector artwork.', advanced: 'Export scalable vector animation assets.' },
      { name: 'Lottie Export', simple: 'Make a light animation for apps.', advanced: 'Export JSON animation for mobile/web interfaces.' },
      { name: 'HTML5 Export', simple: 'Make an interactive web version.', advanced: 'Export canvas/SVG/web-ready interactive animation.' },
      { name: 'WEBM Export', simple: 'Save a web video file.', advanced: 'Export VP9/AV1 web video formats.' },
      { name: 'AVI Export', simple: 'Save a large high-quality video.', advanced: 'Export high-bitrate or uncompressed master files.' },
      { name: 'PNG Sequence', simple: 'Save every frame as a picture.', advanced: 'Export numbered frames for editing or compositing.' },
      { name: 'Social Share', simple: 'Share after parent/teacher review.', advanced: 'Prepare safe upload packages for YouTube, Instagram, or Learnzur Explore.' },
      { name: 'Resolution', simple: 'Choose 720p, 1080p, or 4K quality.', advanced: 'Set render dimensions, aspect ratio, and scaling rules.' },
      { name: 'Bitrate', simple: 'Choose smaller file or higher quality.', advanced: 'Control compression rate, quality, and file size targets.' }
    ]
  },
  {
    id: 'special-features', title: 'Special creative tools', friendlyName: 'For big ideas and advanced projects', level: 'advanced',
    learnerBenefit: 'Lets older learners experiment with professional tools while keeping safety and export checks inside Learnzur.',
    tools: [
      { name: 'Vector Tools', simple: 'Draw clean shapes that stay sharp.', advanced: 'Create scalable paths, fills, strokes, and symbols.' },
      { name: 'Bitmap Tools', simple: 'Paint pictures frame by frame.', advanced: 'Use pixel brushes, onion frames, and raster layers.' },
      { name: '3D Modeling', simple: 'Build simple 3D shapes.', advanced: 'Create and animate 3D objects and scenes.' },
      { name: 'Textures', simple: 'Put a picture or pattern on a 3D object.', advanced: 'Apply image textures, materials, and UV-mapped surfaces.' },
      { name: 'Morph Targets', simple: 'Change one shape into another.', advanced: 'Blend between saved mesh or vector shapes.' },
      { name: 'Camera Tracking', simple: 'Match animation to a real video camera move.', advanced: 'Track footage and solve camera movement for compositing.' },
      { name: 'Motion Trails', simple: 'See the path an object follows.', advanced: 'Display and edit movement paths over time.' },
      { name: 'Auto-Transform', simple: 'Let Learnzur fill changes between two states.', advanced: 'Generate property transitions across selected frames.' },
      { name: 'Expressions', simple: 'Use a small formula to control motion.', advanced: 'Drive values using formulas, variables, and time functions.' },
      { name: 'Scripting', simple: 'Automate repeated animation steps with code.', advanced: 'Use safe scripts to automate batch animation actions.' }
    ]
  }
];

export const beatToolGroups: ToolGroup[] = [
  { id: 'beat-start', title: 'Beat basics', friendlyName: 'Build a rhythm step by step', level: 'simple', learnerBenefit: 'Younger learners can make a beat by choosing drums, claps, melodies, and simple loops.', tools: [
    { name: 'Step Sequencer', simple: 'Tap boxes to choose when a drum plays.', advanced: 'Program drum and melody hits on a grid with bars and beats.' },
    { name: 'Tempo', simple: 'Choose if the beat is slow, medium, or fast.', advanced: 'Set BPM, tap tempo, and tempo automation.' },
    { name: 'Loop Builder', simple: 'Repeat a pattern so it becomes a song part.', advanced: 'Create loops with bar length, swing, and variation lanes.' },
    { name: 'Sound Packs', simple: 'Pick safe sounds like drums, bells, bass, and shakers.', advanced: 'Load curated samples, instruments, and classroom-approved kits.' },
    { name: 'Mute/Solo', simple: 'Turn sounds off or listen to one sound alone.', advanced: 'Mute or solo tracks during mixing and arrangement.' }
  ]},
  { id: 'beat-editing', title: 'Beat editing', friendlyName: 'Shape the sound', level: 'advanced', learnerBenefit: 'Older learners can polish beats for marketplace-ready downloads.', tools: [
    { name: 'Piano Roll', simple: 'Draw notes that go high or low.', advanced: 'Edit note pitch, velocity, length, and quantization.' },
    { name: 'Mixer', simple: 'Make each sound louder or softer.', advanced: 'Control gain, pan, bus routing, sends, and groups.' },
    { name: 'EQ', simple: 'Make a sound brighter or warmer.', advanced: 'Adjust frequencies to remove mud and shape tone.' },
    { name: 'Compression', simple: 'Make the beat feel even and strong.', advanced: 'Control dynamics using threshold, ratio, attack, and release.' },
    { name: 'Reverb/Delay', simple: 'Add echo or space.', advanced: 'Use time-based effects with sends and automation.' },
    { name: 'Automation', simple: 'Make volume or effects change over time.', advanced: 'Draw automation curves for mix and instrument parameters.' },
    { name: 'Master Check', simple: 'Check that the beat is not too loud.', advanced: 'Run loudness, peak, clipping, and export-readiness checks.' }
  ]},
  { id: 'beat-selling', title: 'Sell safely on Lanmat', friendlyName: 'Prepare a beat for the marketplace', level: 'simple', learnerBenefit: 'Learners can save a beat, request review, and sell it with parent approval where needed.', tools: [
    { name: 'Cover Art', simple: 'Choose a simple cover image.', advanced: 'Attach artwork and metadata to the beat listing.' },
    { name: 'Preview Clip', simple: 'Make a short sample people can listen to.', advanced: 'Generate a watermarked or limited preview for buyers.' },
    { name: 'License Type', simple: 'Choose personal use or school project use.', advanced: 'Set license rules, royalties, and buyer permissions.' },
    { name: 'Price Helper', simple: 'Learnzur suggests a fair student price.', advanced: 'Use category and demand data for pricing guidance.' },
    { name: 'Parent/Teacher Review', simple: 'An adult checks before the beat goes live.', advanced: 'Route listings through Flag and Lanmat approval workflow.' }
  ]}
];

export function groupsForAge(groups: ToolGroup[], ageMode: AgeMode) {
  if (ageMode === '8-12') return groups.map((group) => ({ ...group, tools: group.tools.map((tool) => ({ ...tool })) }));
  return groups;
}

export function toolCount(groups: ToolGroup[]) {
  return groups.reduce((total, group) => total + group.tools.length, 0);
}


export const gameToolGroups: ToolGroup[] = [
  { id: 'game-basics', title: 'Game basics', friendlyName: 'Build a playable idea', level: 'simple', learnerBenefit: 'Learners make small games from understandable blocks before adding advanced code.', tools: [
    { name: 'Character', simple: 'Choose who the player controls.', advanced: 'Configure sprite, controller, hitbox, and state.' },
    { name: 'Level', simple: 'Make a place where the game happens.', advanced: 'Design scenes, tile maps, checkpoints, and spawn points.' },
    { name: 'Goal', simple: 'Choose how the player wins.', advanced: 'Define win states, scoring rules, timers, and completion triggers.' },
    { name: 'Obstacle', simple: 'Add something to avoid.', advanced: 'Configure collision, damage, AI movement, and difficulty.' },
    { name: 'Play Test', simple: 'Try the game before sharing.', advanced: 'Run a safe browser preview with input logging and performance checks.' }
  ]},
  { id: 'game-advanced', title: 'Advanced game tools', friendlyName: 'Add challenge and polish', level: 'advanced', learnerBenefit: 'Older learners can add logic without losing the safe guided workflow.', tools: [
    { name: 'Physics', simple: 'Make things jump, fall, or bounce.', advanced: 'Set gravity, velocity, collisions, friction, and triggers.' },
    { name: 'Events', simple: 'Make something happen when the player clicks or touches.', advanced: 'Bind input, scene events, object events, and custom callbacks.' },
    { name: 'Inventory', simple: 'Collect keys, coins, or tools.', advanced: 'Track item state, storage, unlocks, and UI display.' },
    { name: 'Scoreboard', simple: 'Show points.', advanced: 'Record scores, streaks, timers, and Gamfy point awards.' },
    { name: 'Export', simple: 'Share after review.', advanced: 'Package an HTML5 game project and publish to public Explore.' }
  ]}
];

export const websiteAppToolGroups: ToolGroup[] = [
  { id: 'web-light', title: 'Website and app blocks', friendlyName: 'Build pages without confusion', level: 'simple', learnerBenefit: 'Learners create useful pages with guided sections before touching code.', tools: [
    { name: 'Pages', simple: 'Add Home, About, Gallery, or Contact pages.', advanced: 'Create routes, metadata, navigation, and page sections.' },
    { name: 'Text Blocks', simple: 'Add headings and short paragraphs.', advanced: 'Edit semantic HTML, markdown content, and SEO summaries.' },
    { name: 'Buttons', simple: 'Add a button that goes somewhere.', advanced: 'Configure links, actions, forms, and accessible states.' },
    { name: 'Cards', simple: 'Group a picture, title, and description.', advanced: 'Build reusable components with props and responsive grids.' },
    { name: 'Preview', simple: 'See how it looks on phone or laptop.', advanced: 'Test responsive breakpoints and SSR-safe rendering.' }
  ]},
  { id: 'web-advanced', title: 'Advanced website/app tools', friendlyName: 'For older builders', level: 'advanced', learnerBenefit: 'Older learners can learn real frontend thinking while staying in a safe sandbox.', tools: [
    { name: 'HTML', simple: 'Structure the page.', advanced: 'Edit semantic HTML blocks safely.' },
    { name: 'CSS', simple: 'Change colours and layout.', advanced: 'Use scoped CSS, variables, grid, and flexbox.' },
    { name: 'JavaScript', simple: 'Make buttons react.', advanced: 'Write safe client-side interactions with limited APIs.' },
    { name: 'SvelteKit Ideas', simple: 'Learn how pages are organized.', advanced: 'Understand route files, SSR, components, and form actions.' },
    { name: 'Publish', simple: 'Share after safety review.', advanced: 'Publish a public project page indexed by Find and Explore.' }
  ]}
];

export const graphicToolGroups: ToolGroup[] = [
  { id: 'graphic-light', title: 'Ultra-light graphic design', friendlyName: 'Design without heavy tools', level: 'simple', learnerBenefit: 'Children can make clean graphics quickly without confusing professional software.', tools: [
    { name: 'Canvas Size', simple: 'Choose poster, card, thumbnail, or square.', advanced: 'Set preset aspect ratios and safe export dimensions.' },
    { name: 'Text', simple: 'Add a title or caption.', advanced: 'Control font size, hierarchy, alignment, and contrast.' },
    { name: 'Shapes', simple: 'Add circles, boxes, stars, and labels.', advanced: 'Edit vectors, strokes, fills, opacity, and grouping.' },
    { name: 'Colours', simple: 'Choose a calm colour set.', advanced: 'Use accessible palettes, contrast checks, and theme tokens.' },
    { name: 'Stickers', simple: 'Add safe icons and school-friendly decorations.', advanced: 'Layer curated assets with size, position, and opacity controls.' },
    { name: 'Templates', simple: 'Start from a ready layout.', advanced: 'Use reusable layouts for event posters, class notes, and thumbnails.' },
    { name: 'Export PNG', simple: 'Save a picture.', advanced: 'Render optimized PNG for web and print-preview use.' },
    { name: 'Publish', simple: 'Share after review.', advanced: 'Send graphic to Flag, Media, Find, and public Explore.' }
  ]}
];
